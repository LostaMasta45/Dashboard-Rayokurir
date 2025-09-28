"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    MessageCircle,
    Phone,
    FileText,
    FileSpreadsheet,
    Tag,
    X,
    Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
    getContacts,
    saveContact,
    exportContactsToCSV,
    exportContactsToJSON,
    getContactTags,
    type Contact,
} from "@/lib/auth";

export function DatabasePage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        contactId: string;
        contactName: string;
    }>({
        isOpen: false,
        contactId: "",
        contactName: "",
    });
    const [formData, setFormData] = useState({
        name: "",
        whatsapp: "",
        address: "",
        tags: [] as string[],
        notes: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [newTag, setNewTag] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        (async () => {
            await loadData();
        })();
    }, []);

    const loadData = async () => {
        const contactsData = await getContacts();
        setContacts(contactsData);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Nama wajib diisi";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Nama minimal 2 karakter";
        }

        if (!formData.whatsapp.trim()) {
            newErrors.whatsapp = "Nomor WhatsApp wajib diisi";
        } else if (
            !/^(\+62|62|0)[0-9]{9,13}$/.test(
                formData.whatsapp.replace(/\s/g, "")
            )
        ) {
            newErrors.whatsapp =
                "Format nomor WhatsApp tidak valid (contoh: 08123456789)";
        }

        if (!formData.address.trim()) {
            newErrors.address = "Alamat wajib diisi";
        } else if (formData.address.trim().length < 10) {
            newErrors.address = "Alamat minimal 10 karakter";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Mohon periksa kembali form yang diisi");
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingContact) {
                // Update existing contact di Supabase
                await import("@/lib/auth").then(({ updateContact }) =>
                    updateContact({ ...editingContact, ...formData })
                );
                toast.success("Kontak berhasil diperbarui!");
                setEditingContact(null);
            } else {
                // Add new contact ke Supabase
                const newContact: Contact = {
                    id: Date.now().toString(),
                    ...formData,
                    createdAt: new Date().toISOString(),
                };
                await import("@/lib/auth").then(({ saveContact }) =>
                    saveContact(newContact)
                );
                toast.success("Kontak berhasil ditambahkan!");
                setIsAddModalOpen(false);
            }

            setFormData({
                name: "",
                whatsapp: "",
                address: "",
                tags: [],
                notes: "",
            });
            setErrors({});
            await loadData();
        } catch (error) {
            toast.error("Gagal menyimpan kontak. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            whatsapp: contact.whatsapp,
            address: contact.address,
            tags: contact.tags || [],
            notes: contact.notes || "",
        });
        setErrors({});
    };

    const handleDeleteClick = (contact: Contact) => {
        setDeleteConfirmation({
            isOpen: true,
            contactId: contact.id,
            contactName: contact.name,
        });
    };

    const handleDeleteConfirm = async () => {
        // Hapus kontak di Supabase
        const { supabase } = await import("@/lib/supabaseClient");
        await supabase
            .from("contacts")
            .delete()
            .eq("id", deleteConfirmation.contactId);
        toast.success("Kontak berhasil dihapus!");
        setDeleteConfirmation({
            isOpen: false,
            contactId: "",
            contactName: "",
        });
        await loadData();
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, newTag.trim()],
            });
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((tag) => tag !== tagToRemove),
        });
    };

    const toggleTagFilter = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const openWhatsApp = async (whatsapp: string, contactId: string) => {
        const cleanNumber = whatsapp.replace(/\D/g, "");
        const formattedNumber = cleanNumber.startsWith("0")
            ? "62" + cleanNumber.slice(1)
            : cleanNumber.startsWith("62")
            ? cleanNumber
            : "62" + cleanNumber;

        // Update last contacted di Supabase
        const contact = contacts.find((c) => c.id === contactId);
        if (contact) {
            await import("@/lib/auth").then(({ updateContact }) =>
                updateContact({
                    ...contact,
                    lastContacted: new Date().toISOString(),
                })
            );
            await loadData();
        }
        toast.success("Membuka WhatsApp...");
        window.open(`https://wa.me/${formattedNumber}`, "_blank");
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            exportContactsToCSV(contacts);
            toast.success("Data berhasil diekspor ke CSV!");
        } catch (error) {
            toast.error("Gagal mengekspor data");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJSON = async () => {
        setIsExporting(true);
        try {
            exportContactsToJSON(contacts);
            toast.success("Data berhasil diekspor ke JSON!");
        } catch (error) {
            toast.error("Gagal mengekspor data");
        } finally {
            setIsExporting(false);
        }
    };

    const handleInputChange = (field: string, value: string | string[]) => {
        setFormData({ ...formData, [field]: value });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    const filteredContacts = contacts.filter((contact) => {
        const matchesSearch =
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.whatsapp.includes(searchTerm) ||
            contact.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.notes &&
                contact.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTags =
            selectedTags.length === 0 ||
            selectedTags.some((tag) => contact.tags?.includes(tag));

        return matchesSearch && matchesTags;
    });

    const [allTags, setAllTags] = useState<string[]>([]);
    useEffect(() => {
        (async () => {
            const tags = await getContactTags();
            setAllTags(tags);
        })();
    }, [contacts]);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Database Kontak
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Kelola database kontak untuk WhatsApp Bot
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        disabled={isExporting || contacts.length === 0}
                        className="flex items-center gap-2 bg-transparent"
                    >
                        {isExporting ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <FileSpreadsheet className="h-4 w-4" />
                        )}
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportJSON}
                        disabled={isExporting || contacts.length === 0}
                        className="flex items-center gap-2 bg-transparent"
                    >
                        {isExporting ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <FileText className="h-4 w-4" />
                        )}
                        Export JSON
                    </Button>

                    <Dialog
                        open={isAddModalOpen}
                        onOpenChange={setIsAddModalOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="bg-rayo-primary hover:bg-rayo-dark">
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Kontak
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Tambah Kontak Baru</DialogTitle>
                                <DialogDescription>
                                    Tambahkan kontak baru untuk database
                                    WhatsApp Bot
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <FormField
                                    label="Nama Lengkap"
                                    required
                                    error={errors.name}
                                >
                                    <FormInput
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "name",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Masukkan nama lengkap"
                                        error={errors.name}
                                        disabled={isSubmitting}
                                    />
                                </FormField>

                                <FormField
                                    label="Nomor WhatsApp"
                                    required
                                    error={errors.whatsapp}
                                >
                                    <FormInput
                                        id="whatsapp"
                                        value={formData.whatsapp}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "whatsapp",
                                                e.target.value
                                            )
                                        }
                                        placeholder="08123456789 atau +62123456789"
                                        error={errors.whatsapp}
                                        disabled={isSubmitting}
                                    />
                                </FormField>

                                <FormField
                                    label="Alamat Lengkap"
                                    required
                                    error={errors.address}
                                >
                                    <FormTextarea
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "address",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Masukkan alamat lengkap"
                                        rows={3}
                                        error={errors.address}
                                        disabled={isSubmitting}
                                    />
                                </FormField>

                                <FormField label="Tags">
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            id="tags"
                                            value={newTag}
                                            onChange={(e) =>
                                                setNewTag(e.target.value)
                                            }
                                            placeholder="Tambah tag"
                                            onKeyPress={(e) =>
                                                e.key === "Enter" &&
                                                (e.preventDefault(), addTag())
                                            }
                                            disabled={isSubmitting}
                                        />
                                        <Button
                                            type="button"
                                            onClick={addTag}
                                            size="sm"
                                            disabled={isSubmitting}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {formData.tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="flex items-center gap-1"
                                            >
                                                {tag}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() =>
                                                        !isSubmitting &&
                                                        removeTag(tag)
                                                    }
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                </FormField>

                                <FormField label="Catatan">
                                    <FormTextarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "notes",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Catatan tambahan (opsional)"
                                        rows={2}
                                        disabled={isSubmitting}
                                    />
                                </FormField>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1"
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-rayo-primary hover:bg-rayo-dark"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <LoadingSpinner size="sm" />
                                                <span>Menyimpan...</span>
                                            </div>
                                        ) : (
                                            "Simpan"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Cari nama, nomor, alamat, atau catatan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {allTags.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                            {allTags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant={
                                        selectedTags.includes(tag)
                                            ? "default"
                                            : "outline"
                                    }
                                    className="cursor-pointer"
                                    onClick={() => toggleTagFilter(tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rayo-primary/10 rounded-lg">
                                <MessageCircle className="h-5 w-5 text-rayo-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Kontak
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {contacts.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Phone className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Hasil Pencarian
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {filteredContacts.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Plus className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Ditambahkan Hari Ini
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {
                                        contacts.filter(
                                            (c) =>
                                                new Date(
                                                    c.createdAt
                                                ).toDateString() ===
                                                new Date().toDateString()
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Tag className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Tags
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {allTags.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Contacts List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kontak</CardTitle>
                    <CardDescription>
                        {filteredContacts.length} kontak ditemukan
                        {selectedTags.length > 0 &&
                            ` dengan filter: ${selectedTags.join(", ")}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredContacts.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {searchTerm || selectedTags.length > 0
                                    ? "Tidak ada kontak yang sesuai dengan pencarian/filter"
                                    : "Belum ada kontak tersimpan"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredContacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">
                                                {contact.name}
                                            </h3>
                                            {contact.lastContacted && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    Terakhir dihubungi:{" "}
                                                    {new Date(
                                                        contact.lastContacted
                                                    ).toLocaleDateString(
                                                        "id-ID"
                                                    )}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {contact.whatsapp}
                                        </p>
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {contact.address}
                                        </p>
                                        {contact.notes && (
                                            <p className="text-sm text-gray-600 italic">
                                                "{contact.notes}"
                                            </p>
                                        )}
                                        {contact.tags &&
                                            contact.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {contact.tags.map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                openWhatsApp(
                                                    contact.whatsapp,
                                                    contact.id
                                                )
                                            }
                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(contact)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                handleDeleteClick(contact)
                                            }
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Dialog
                open={!!editingContact}
                onOpenChange={() => setEditingContact(null)}
            >
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Kontak</DialogTitle>
                        <DialogDescription>
                            Perbarui informasi kontak
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField
                            label="Nama Lengkap"
                            required
                            error={errors.name}
                        >
                            <FormInput
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                    handleInputChange("name", e.target.value)
                                }
                                placeholder="Masukkan nama lengkap"
                                error={errors.name}
                                disabled={isSubmitting}
                            />
                        </FormField>

                        <FormField
                            label="Nomor WhatsApp"
                            required
                            error={errors.whatsapp}
                        >
                            <FormInput
                                id="edit-whatsapp"
                                value={formData.whatsapp}
                                onChange={(e) =>
                                    handleInputChange(
                                        "whatsapp",
                                        e.target.value
                                    )
                                }
                                placeholder="08123456789 atau +62123456789"
                                error={errors.whatsapp}
                                disabled={isSubmitting}
                            />
                        </FormField>

                        <FormField
                            label="Alamat Lengkap"
                            required
                            error={errors.address}
                        >
                            <FormTextarea
                                id="edit-address"
                                value={formData.address}
                                onChange={(e) =>
                                    handleInputChange("address", e.target.value)
                                }
                                placeholder="Masukkan alamat lengkap"
                                rows={3}
                                error={errors.address}
                                disabled={isSubmitting}
                            />
                        </FormField>

                        <FormField label="Tags">
                            <div className="flex gap-2 mb-2">
                                <Input
                                    id="edit-tags"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Tambah tag"
                                    onKeyPress={(e) =>
                                        e.key === "Enter" &&
                                        (e.preventDefault(), addTag())
                                    }
                                    disabled={isSubmitting}
                                />
                                <Button
                                    type="button"
                                    onClick={addTag}
                                    size="sm"
                                    disabled={isSubmitting}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {formData.tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                    >
                                        {tag}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() =>
                                                !isSubmitting && removeTag(tag)
                                            }
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </FormField>

                        <FormField label="Catatan">
                            <FormTextarea
                                id="edit-notes"
                                value={formData.notes}
                                onChange={(e) =>
                                    handleInputChange("notes", e.target.value)
                                }
                                placeholder="Catatan tambahan (opsional)"
                                rows={2}
                                disabled={isSubmitting}
                            />
                        </FormField>

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingContact(null)}
                                className="flex-1"
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-rayo-primary hover:bg-rayo-dark"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <LoadingSpinner size="sm" />
                                        <span>Memperbarui...</span>
                                    </div>
                                ) : (
                                    "Perbarui"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={deleteConfirmation.isOpen}
                onClose={() =>
                    setDeleteConfirmation({
                        isOpen: false,
                        contactId: "",
                        contactName: "",
                    })
                }
                onConfirm={handleDeleteConfirm}
                title="Hapus Kontak"
                description={`Apakah Anda yakin ingin menghapus kontak "${deleteConfirmation.contactName}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                variant="destructive"
            />
        </div>
    );
}
