// Native fetch is available in Node.js v18+
// const fetch = require('node-fetch');

// CONFIGURATION
const PORT = 3003; // User is running on port 3003
const WEBHOOK_URL = `http://localhost:${PORT}/api/telegram/kurir/webhook`;
const ORDER_ID = process.argv[2] || "ORDER_ID_HERE"; // Pass order ID as argument or edit this
const TELEGRAM_USER_ID = 123456789; // Dummy Telegram User ID (must match a courier in DB if validation exists)
const CHAT_ID = 123456789;

async function runTest() {
    if (ORDER_ID === "ORDER_ID_HERE") {
        console.error("Please provide an Order ID as an argument: node scripts/test_pod_upload.js <ORDER_ID>");
        process.exit(1);
    }

    console.log(`Testing POD Upload for Order: ${ORDER_ID}`);
    console.log(`Target URL: ${WEBHOOK_URL}`);

    // STEP 1: Simulate Button Click "Upload Foto POD"
    // This sets the user state in the bot to expect a photo for this order
    console.log("\n[1/2] Simulating 'Upload Foto POD' button click...");
    const callbackPayload = {
        update_id: Date.now(),
        callback_query: {
            id: "cb_" + Date.now(),
            from: { id: TELEGRAM_USER_ID, first_name: "TestKurir" },
            message: {
                message_id: 100,
                chat: { id: CHAT_ID }
            },
            data: `rk:pod:${ORDER_ID}`
        }
    };

    try {
        const res1 = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(callbackPayload)
        });
        const json1 = await res1.json();
        console.log("Response:", json1);
    } catch (e) {
        console.error("Error in Step 1:", e.message);
    }

    // STEP 2: Simulate Sending Photo
    // The bot should now associate this photo with the Order ID from step 1
    console.log("\n[2/2] Simulating Photo Upload...");
    // We use a real file_id from Telegram (or a dummy one). 
    // Since we are mocking the webhook, we can send ANY string as file_id.
    // However, our proxy /api/telegram/image relies on fetching this from Telegram.
    // If we use a FAKE ID, the proxy will fail to display it later (404 from Telegram).
    // BUT for "Success Upload" test, it should work as long as the bot saves it to DB.
    
    // Use a widely accessible public file_id if known, or just a dummy string.
    // Note: The photo wont render in the app if ID is fake, but it will appear in the array.
    const DUMMY_FILE_ID = "AgACAgUAAxkBAAIB...TestFileID"; 

    const photoPayload = {
        update_id: Date.now() + 1,
        message: {
            message_id: 101,
            from: { id: TELEGRAM_USER_ID, first_name: "TestKurir" },
            chat: { id: CHAT_ID, type: "private" },
            date: Math.floor(Date.now() / 1000),
            photo: [
                { file_id: "small_thumbnail", file_unique_id: "u1", width: 100, height: 100 },
                { file_id: DUMMY_FILE_ID, file_unique_id: "u2", width: 800, height: 800 } // Largest one
            ],
            caption: "Ini foto bukti pengiriman"
        }
    };

    try {
        const res2 = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(photoPayload)
        });
        const json2 = await res2.json();
        console.log("Response:", json2);
        
        if (json2.ok) {
            console.log("\n✅ Test Completed Successfully!");
            console.log("Check the Admin Dashboard > Bukti Pengiriman.");
            console.log(`Note: Since we used a dummy file_id '${DUMMY_FILE_ID}', the image might show as broken/loading in the gallery, but the entry should exist.`);
        } else {
            console.log("\n❌ Test Failed.");
        }

    } catch (e) {
        console.error("Error in Step 2:", e.message);
    }
}

runTest();
