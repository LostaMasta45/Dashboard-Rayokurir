import type React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span className="text-red-500">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function FormInput({ error, className, ...props }: FormInputProps) {
  return (
    <Input className={cn(error && "border-red-500 focus:border-red-500 focus:ring-red-500", className)} {...props} />
  )
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export function FormTextarea({ error, className, ...props }: FormTextareaProps) {
  return (
    <Textarea className={cn(error && "border-red-500 focus:border-red-500 focus:ring-red-500", className)} {...props} />
  )
}
