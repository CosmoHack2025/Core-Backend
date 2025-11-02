const Contact = require("../../model/contactModel/contact");
const { Admin } = require("../../model");
const { sendContactConfirmationEmail, sendAdminNotificationEmail, sendReplyNotificationEmail } = require("../../emailService/bookingEmailService");


const submitContactForm = async (req, res) => {
  try {
  
    const { fullName, email, phone, subject, message } = req.body;

   

    console.log(`✅ Data received from: ${fullName} (${email})`);

    console.log("\n💾 Step 2: Saving contact form to database...");

    // Create contact entry
    const contact = await Contact.create({
      fullName,
      email,
      phone: phone || null,
      subject,
      message,
      status: "pending",
    });

    console.log(`✅ Contact form saved with ID: ${contact.id}`);

    console.log("\n📧 Step 3: Sending confirmation email to user...");

    // Send confirmation email to user (don't block response)
    sendContactConfirmationEmail(email, fullName)
      .then(() => console.log("✅ User confirmation email sent"))
      .catch((err) => console.error("⚠️ User confirmation email failed:", err.message));

    console.log("\n📧 Step 4: Sending notification email to admin...");

    // Send notification to admin (don't block response)
    sendAdminNotificationEmail({
      id: contact.id,
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      createdAt: contact.createdAt,
    })
      .then(() => console.log("✅ Admin notification email sent"))
      .catch((err) => console.error("⚠️ Admin notification email failed:", err.message));

    console.log("\n✨ Step 5: Sending response to user...");
    console.log("========== CONTACT FORM SUBMISSION ENDED (SUCCESS) ==========\n");

    return res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We have received your message and will get back to you soon.",
      data: {
        contactId: contact.id,
        fullName: contact.fullName,
        email: contact.email,
        subject: contact.subject,
        status: contact.status,
        submittedAt: contact.createdAt,
      },
    });
  } catch (error) {
    console.log("\n💥 CRITICAL ERROR in submitContactForm!");
    console.error("Error details:", error);
    console.log("========== CONTACT FORM SUBMISSION ENDED (ERROR) ==========\n");

    return res.status(500).json({
      success: false,
      message: "Failed to submit contact form. Please try again later.",
      error: error.message,
    });
  }
};

/**
 * Get all contact forms (Admin only)
 */
const getAllContacts = async (req, res) => {
  try {
    console.log("\n📋 Fetching all contact forms...");

    const { status } = req.query;

    // Build query filter
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const contacts = await Contact.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Admin,
          as: "admin",
          attributes: ["id", "fullName", "email"],
          required: false,
        },
      ],
    });

    console.log(`✅ Found ${contacts.length} contact forms`);

    return res.status(200).json({
      success: true,
      message: "Contact forms retrieved successfully",
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact forms",
      error: error.message,
    });
  }
};

/**
 * Get contact form by ID (Admin only)
 */
const getContactById = async (req, res) => {
  try {
    const { contactId } = req.params;

    console.log(`\n🔍 Fetching contact form with ID: ${contactId}`);

    const contact = await Contact.findByPk(contactId, {
      include: [
        {
          model: Admin,
          as: "admin",
          attributes: ["id", "fullName", "email"],
          required: false,
        },
      ],
    });

    if (!contact) {
      console.log("❌ Contact form not found");
      return res.status(404).json({
        success: false,
        message: "Contact form not found",
      });
    }

    console.log(`✅ Contact form found: ${contact.id}`);

    return res.status(200).json({
      success: true,
      message: "Contact form retrieved successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact form",
      error: error.message,
    });
  }
};

/**
 * Reply to contact form (Admin only)
 */
const replyToContact = async (req, res) => {
  try {
    console.log("\n========== CONTACT REPLY STARTED ==========");
    const { contactId } = req.params;
    const { reply } = req.body;
    const adminId = req.user.id;

    console.log(`📝 Step 1: Processing reply for contact ID: ${contactId}`);
    console.log(`   - Admin ID: ${adminId}`);

    // Validate reply
    if (!reply || reply.trim() === "") {
      console.log("❌ Validation failed: Reply is empty");
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      });
    }

    console.log("\n🔍 Step 2: Fetching contact form...");

    // Fetch contact form
    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      console.log("❌ Contact form not found");
      return res.status(404).json({
        success: false,
        message: "Contact form not found",
      });
    }

    console.log(`✅ Contact form found: ${contact.fullName} (${contact.email})`);

    console.log("\n🔍 Step 3: Fetching admin details...");

    // Fetch admin details
    const admin = await Admin.findByPk(adminId, {
      attributes: ["id", "fullName", "email"],
    });

    if (!admin) {
      console.log("❌ Admin not found");
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    console.log(`✅ Admin found: ${admin.fullName}`);

    console.log("\n💾 Step 4: Updating contact form with reply...");

    // Update contact with reply
    await contact.update({
      adminReply: reply,
      repliedBy: adminId,
      repliedAt: new Date(),
      status: "replied",
    });

    console.log("✅ Contact form updated with reply");

    console.log("\n📧 Step 5: Sending reply notification to user...");

    // Send reply notification email to user (don't block response)
    sendReplyNotificationEmail(
      {
        fullName: contact.fullName,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
      },
      reply,
      admin.fullName
    )
      .then(() => console.log("✅ Reply notification email sent to user"))
      .catch((err) => console.error("⚠️ Reply notification email failed:", err.message));

    console.log("\n✨ Step 6: Sending response...");
    console.log("========== CONTACT REPLY ENDED (SUCCESS) ==========\n");

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully. User has been notified via email.",
      data: {
        contactId: contact.id,
        userEmail: contact.email,
        userName: contact.fullName,
        status: contact.status,
        repliedBy: admin.fullName,
        repliedAt: contact.repliedAt,
        reply: contact.adminReply,
      },
    });
  } catch (error) {
    console.log("\n💥 CRITICAL ERROR in replyToContact!");
    console.error("Error details:", error);
    console.log("========== CONTACT REPLY ENDED (ERROR) ==========\n");

    return res.status(500).json({
      success: false,
      message: "Failed to send reply",
      error: error.message,
    });
  }
};

/**
 * Delete contact form (Admin only)
 */
const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    console.log(`\n🗑️ Deleting contact form with ID: ${contactId}`);

    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      console.log("❌ Contact form not found");
      return res.status(404).json({
        success: false,
        message: "Contact form not found",
      });
    }

    await contact.destroy();
    console.log("✅ Contact form deleted successfully");

    return res.status(200).json({
      success: true,
      message: "Contact form deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete contact form",
      error: error.message,
    });
  }
};

module.exports = {
  submitContactForm,
  getAllContacts,
  getContactById,
  replyToContact,
  deleteContact,
};
