const db = require("../database/db");

/**
 * List Conversations Inbox
 */
const listConversations = async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [conversations] = await db.query(
            `SELECT c.*, 
                    v.id AS vehicle_id, v.title AS vehicle_title, v.price AS vehicle_price, v.status AS vehicle_status,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS vehicle_image,
                    buyer.id AS buyer_id, buyer.first_name AS buyer_first_name, buyer.last_name AS buyer_last_name, buyer.profile_photo AS buyer_avatar,
                    seller.id AS seller_id, seller.first_name AS seller_first_name, seller.last_name AS seller_last_name, seller.profile_photo AS seller_avatar,
                    (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
                    (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_time,
                    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) AS unread_count
             FROM conversations c
             JOIN vehicles v ON c.vehicle_id = v.id
             JOIN users buyer ON c.buyer_id = buyer.id
             JOIN users seller ON c.seller_id = seller.id
             WHERE c.buyer_id = ? OR c.seller_id = ?
             ORDER BY c.updated_at DESC`,
            [userId, userId, userId]
        );

        res.render("messages/index", {
            title: "My Messages",
            conversations,
            activeConversation: null
        });
    } catch (error) {
        console.error("List Conversations Error:", error);
        req.flash("error_msg", "Failed to load conversations.");
        res.render("messages/index", {
            title: "My Messages",
            conversations: [],
            activeConversation: null
        });
    }
};

/**
 * View Conversation Chat Thread
 */
const viewChat = async (req, res) => {
    const userId = req.session.user.id;
    const conversationId = req.params.conversationId;

    try {
        // Fetch conversation with vehicle and participants
        const [convos] = await db.query(
            `SELECT c.*, 
                    v.id AS vehicle_id, v.title AS vehicle_title, v.price AS vehicle_price, v.status AS vehicle_status, v.brand, v.model,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS vehicle_image,
                    buyer.id AS buyer_id, buyer.first_name AS buyer_first_name, buyer.last_name AS buyer_last_name, buyer.profile_photo AS buyer_avatar,
                    seller.id AS seller_id, seller.first_name AS seller_first_name, seller.last_name AS seller_last_name, seller.profile_photo AS seller_avatar
             FROM conversations c
             JOIN vehicles v ON c.vehicle_id = v.id
             JOIN users buyer ON c.buyer_id = buyer.id
             JOIN users seller ON c.seller_id = seller.id
             WHERE c.id = ? AND (c.buyer_id = ? OR c.seller_id = ?)`,
            [conversationId, userId, userId]
        );

        if (convos.length === 0) {
            req.flash("error_msg", "Conversation not found or access denied.");
            return res.redirect("/messages");
        }

        const activeConversation = convos[0];

        // Mark incoming messages as read
        await db.query(
            "UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?",
            [conversationId, userId]
        );

        // Fetch all messages for this conversation
        const [messages] = await db.query(
            `SELECT m.*, u.first_name, u.profile_photo
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.conversation_id = ?
             ORDER BY m.created_at ASC`,
            [conversationId]
        );

        // Fetch all user conversations for sidebar
        const [allConversations] = await db.query(
            `SELECT c.*, 
                    v.title AS vehicle_title,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS vehicle_image,
                    buyer.id AS buyer_id, buyer.first_name AS buyer_first_name, buyer.profile_photo AS buyer_avatar,
                    seller.id AS seller_id, seller.first_name AS seller_first_name, seller.profile_photo AS seller_avatar,
                    (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
                    (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_time,
                    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) AS unread_count
             FROM conversations c
             JOIN vehicles v ON c.vehicle_id = v.id
             JOIN users buyer ON c.buyer_id = buyer.id
             JOIN users seller ON c.seller_id = seller.id
             WHERE c.buyer_id = ? OR c.seller_id = ?
             ORDER BY c.updated_at DESC`,
            [userId, userId, userId]
        );

        res.render("messages/chat", {
            title: `Chat with ${userId === activeConversation.buyer_id ? activeConversation.seller_first_name : activeConversation.buyer_first_name}`,
            conversations: allConversations,
            activeConversation,
            messages
        });
    } catch (error) {
        console.error("View Chat Error:", error);
        req.flash("error_msg", "Error loading chat thread.");
        res.redirect("/messages");
    }
};

/**
 * Initiate Conversation from Vehicle Details Page
 */
const initiateConversation = async (req, res) => {
    const buyerId = req.session.user.id;
    const { vehicle_id, message } = req.body;

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicle_id]);
        if (vehicles.length === 0) {
            req.flash("error_msg", "Vehicle not found.");
            return res.redirect("/vehicles");
        }

        const vehicle = vehicles[0];
        const sellerId = vehicle.seller_id;

        if (buyerId === sellerId) {
            req.flash("error_msg", "You cannot send messages on your own vehicle listing.");
            return res.redirect(`/vehicles/${vehicle_id}`);
        }

        // Find or create conversation
        let conversationId;
        const [existing] = await db.query(
            "SELECT id FROM conversations WHERE vehicle_id = ? AND buyer_id = ? AND seller_id = ?",
            [vehicle_id, buyerId, sellerId]
        );

        if (existing.length > 0) {
            conversationId = existing[0].id;
        } else {
            const [newConvo] = await db.query(
                "INSERT INTO conversations (vehicle_id, buyer_id, seller_id) VALUES (?, ?, ?)",
                [vehicle_id, buyerId, sellerId]
            );
            conversationId = newConvo.insertId;
        }

        // Send initial message if provided
        const textMessage = message && message.trim() !== "" 
            ? message.trim() 
            : `Hi, I am interested in your ${vehicle.title}. Is it still available for inspection?`;

        await db.query(
            "INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)",
            [conversationId, buyerId, textMessage]
        );

        await db.query(
            "UPDATE conversations SET updated_at = NOW() WHERE id = ?",
            [conversationId]
        );

        // Notify seller
        await db.query(
            `INSERT INTO notifications (user_id, title, message, link, type) 
             VALUES (?, 'New Buyer Inquiry!', ?, ?, 'info')`,
            [
                sellerId,
                `${req.session.user.first_name} sent you a message about ${vehicle.title}.`,
                `/messages/${conversationId}`
            ]
        );

        req.flash("success_msg", "Message sent to seller!");
        res.redirect(`/messages/${conversationId}`);
    } catch (error) {
        console.error("Initiate Conversation Error:", error);
        req.flash("error_msg", "Failed to start conversation.");
        res.redirect(`/vehicles/${vehicle_id}`);
    }
};

/**
 * Send Message within Existing Conversation
 */
const sendMessage = async (req, res) => {
    const senderId = req.session.user.id;
    const conversationId = req.params.conversationId;
    const { message } = req.body;

    if (!message || message.trim() === "") {
        if (req.xhr) return res.status(400).json({ success: false, message: "Message cannot be empty." });
        return res.redirect(`/messages/${conversationId}`);
    }

    try {
        const [convos] = await db.query(
            "SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)",
            [conversationId, senderId, senderId]
        );

        if (convos.length === 0) {
            if (req.xhr) return res.status(403).json({ success: false, message: "Access denied." });
            req.flash("error_msg", "Conversation not found or access denied.");
            return res.redirect("/messages");
        }

        const conversation = convos[0];
        const recipientId = senderId === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id;

        const [msgResult] = await db.query(
            "INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)",
            [conversationId, senderId, message.trim()]
        );

        await db.query(
            "UPDATE conversations SET updated_at = NOW() WHERE id = ?",
            [conversationId]
        );

        // Notification for recipient
        await db.query(
            `INSERT INTO notifications (user_id, title, message, link, type) 
             VALUES (?, 'New Message Received', ?, ?, 'info')`,
            [
                recipientId,
                `${req.session.user.first_name}: ${message.trim().substring(0, 60)}...`,
                `/messages/${conversationId}`
            ]
        );

        if (req.xhr || req.headers.accept.indexOf("json") > -1) {
            return res.json({
                success: true,
                message: {
                    id: msgResult.insertId,
                    conversation_id: conversationId,
                    sender_id: senderId,
                    message: message.trim(),
                    created_at: new Date()
                }
            });
        }

        res.redirect(`/messages/${conversationId}`);
    } catch (error) {
        console.error("Send Message Error:", error);
        if (req.xhr) return res.status(500).json({ success: false, message: "Server error sending message." });
        req.flash("error_msg", "Failed to send message.");
        res.redirect(`/messages/${conversationId}`);
    }
};

module.exports = {
    listConversations,
    viewChat,
    initiateConversation,
    sendMessage
};
