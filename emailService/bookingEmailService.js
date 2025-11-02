const { sendEmail } = require("./emailService");

// Send highly enhanced pinkish email to doctor for new booking
const sendBookingNotificationToDoctor = async (doctorEmail, booking, doctorName) => {
  try {
    const subject = " New Appointment Booking Request — Action Required";

    const htmlContent = `
      <div style="font-family: 'Poppins', Arial, sans-serif; background: linear-gradient(135deg, #ffebf5, #ffd6ec); padding: 30px; border-radius: 16px; max-width:600px; margin:auto; box-shadow: 0 0 10px rgba(255,105,180,0.2);">
        
        <div style="text-align:center;">
          <h2 style="color:#b30059; font-size:26px; margin-bottom:5px;"> New Appointment Request</h2>
          <p style="color:#6b0040; font-size:15px;">You have a new patient consultation request waiting for review.</p>
          <hr style="border:none; border-top:2px dashed #ff4da6; width:60%; margin:18px auto;">
        </div>
        
        <div style="background:white; padding:20px; border-radius:14px; border:1px solid #ffb3d9;">
          <p style="color:#333; font-size:15px;"> Dear <strong>Dr. ${doctorName}</strong>,</p>

          <h3 style="color:#b30059; font-size:18px; margin-top:12px;"> Booking Details:</h3>

          <table style="width:100%; margin-top:10px; border-collapse:collapse;">
            <tbody>
              <tr><td style="padding:6px 0;"><strong>Patient:</strong></td><td style="padding:6px 0;">${booking.fullName}</td></tr>
              <tr><td style="padding:6px 0;"><strong>Email:</strong></td><td style="padding:6px 0;">${booking.email}</td></tr>
              <tr><td style="padding:6px 0;"><strong>Phone:</strong></td><td style="padding:6px 0;">${booking.phoneNumber}</td></tr>
              <tr><td style="padding:6px 0;"><strong>Type:</strong></td><td style="padding:6px 0;"><span style="background:#ffe0f0; border-radius:6px; padding:2px 8px;">${booking.appointmentType}</span></td></tr>
              <tr><td style="padding:6px 0;"><strong>Date:</strong></td><td>${booking.appointmentDate}</td></tr>
              <tr><td style="padding:6px 0;"><strong>Time:</strong></td><td>${booking.appointmentTime}</td></tr>
              <tr><td style="padding:6px 0;"><strong>Reason:</strong></td><td>${booking.reasonForConsultation}</td></tr>
              ${booking.currentMedications ? `<tr><td><strong>Medications:</strong></td><td>${booking.currentMedications}</td></tr>` : ""}
              ${booking.knownAllergies ? `<tr><td><strong>Allergies:</strong></td><td>${booking.knownAllergies}</td></tr>` : ""}
            </tbody>
          </table>

          <div style="text-align:center;">
            <a href="#login" style="display:inline-block; margin-top:16px; background:#ff4da6; color:white; padding:10px 22px; border-radius:8px; text-decoration:none; font-weight:600;">Review Request</a>
          </div>
        </div>

        <footer style="text-align:center; margin-top:25px; color:#7a2e54; font-size:13px;">
          ❤️ Powered by Healthcare System — Automated Notification
        </footer>
      </div>
    `;

    await sendEmail(doctorEmail, subject, htmlContent);
  } catch (error) {
    console.error("Error sending email to doctor:", error);
    throw error;
  }
};


// Send enhanced email to patient after doctor response
const sendBookingResponseToPatient = async (patientEmail, booking, status, doctorResponse, meetingLink) => {
  try {

    const isConfirmed = status === "confirmed";
    const subject = `💗 Appointment ${isConfirmed ? "Confirmed " : "Declined "} — ${booking.appointmentDate}`;

    const htmlContent = `
      <div style="font-family: 'Poppins', Arial, sans-serif; background: linear-gradient(135deg, #ffe7f0, #ffd1e8); padding: 30px; border-radius: 16px; max-width:600px; margin:auto; box-shadow: 0 0 10px rgba(255,105,180,0.2);">
      
        <div style="text-align:center;">
          <h2 style="color:${isConfirmed ? '#00803b' : '#b30059'};">
            ${isConfirmed ? " Your Appointment is Confirmed!" : " Appointment Declined"}
          </h2>
          <p style="color:#6b0040;">Here are your updated details:</p>
          <hr style="border:none; border-top:2px dashed #ff4da6; width:60%; margin:18px auto;">
        </div>

        <div style="background:white; padding:20px; border-radius:14px; border:1px solid #ffb3d9;">

          <p style="color:#333;">Dear <strong>${booking.fullName}</strong>,</p>
          
          <table style="width:100%; margin:10px 0; border-collapse:collapse;">
            <tbody>
              <tr><td style="padding:6px;"><strong>Date:</strong></td><td>${booking.appointmentDate}</td></tr>
              <tr><td style="padding:6px;"><strong>Time:</strong></td><td>${booking.appointmentTime}</td></tr>
              <tr><td style="padding:6px;"><strong>Type:</strong></td><td><span style="background:#ffd1e8; padding:3px 10px; border-radius:6px;">${booking.appointmentType}</span></td></tr>
              <tr><td style="padding:6px;"><strong>Status:</strong></td><td style="font-weight:700;">${status.toUpperCase()}</td></tr>
              ${doctorResponse ? `<tr><td><strong>Doctor Notes:</strong></td><td>${doctorResponse}</td></tr>` : ""}
              ${meetingLink && isConfirmed ? `<tr><td><strong>Meeting:</strong></td><td><a style="color:#b30059; font-weight:600;" href="${meetingLink}">Join Appointment</a></td></tr>` : ""}
            </tbody>
          </table>

          <p style="color:#555;">
            ${isConfirmed 
              ? "Please be on time for your appointment. We're excited to assist you 💖" 
              : " You're welcome to request another appointment anytime."}
          </p>
        </div>

        <footer style="text-align:center; margin-top:25px; color:#7a2e54; font-size:13px;">
          💖 Thank you for choosing our healthcare services!
        </footer>
      </div>
    `;

    await sendEmail(patientEmail, subject, htmlContent);

  } catch (error) {
    console.error("Error sending email to patient:", error);
    throw error;
  }
};



const sendContactConfirmationEmail = async (userEmail, fullName) => {
  try {
    const subject = "✅ Contact Form Received — We'll Get Back to You Soon!";

    const htmlContent = `
      <div style="font-family: 'Poppins', Arial, sans-serif; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); padding: 30px; border-radius: 16px; max-width:600px; margin:auto; box-shadow: 0 0 10px rgba(76,175,80,0.2);">
        
        <div style="text-align:center;">
          <h2 style="color:#2e7d32; font-size:26px; margin-bottom:5px;">✅ Thank You for Contacting Us!</h2>
          <p style="color:#1b5e20; font-size:15px;">We have successfully received your message.</p>
          <hr style="border:none; border-top:2px dashed #4caf50; width:60%; margin:18px auto;">
        </div>
        
        <div style="background:white; padding:20px; border-radius:14px; border:1px solid #81c784;">
          <p style="color:#333; font-size:15px;">Dear <strong>${fullName}</strong>,</p>

          <div style="background:#f1f8e9; padding:15px; border-radius:10px; margin:15px 0; border-left:4px solid #4caf50;">
            <p style="color:#555; margin:0;">Our team will review your message and get back to you as soon as possible, typically within <strong>24-48 hours</strong>.</p>
          </div>

          <h3 style="color:#2e7d32; font-size:18px; margin-top:12px;">📋 What Happens Next?</h3>
          
          <table style="width:100%; margin-top:10px;">
            <tbody>
              <tr>
                <td style="padding:8px 0; vertical-align:top; width:40px;">
                  <span style="display:inline-block; width:28px; height:28px; background:#4caf50; color:white; text-align:center; line-height:28px; border-radius:50%; font-weight:bold;">1</span>
                </td>
                <td style="padding:8px 0; color:#555;">Our team will review your message</td>
              </tr>
              <tr>
                <td style="padding:8px 0; vertical-align:top;">
                  <span style="display:inline-block; width:28px; height:28px; background:#4caf50; color:white; text-align:center; line-height:28px; border-radius:50%; font-weight:bold;">2</span>
                </td>
                <td style="padding:8px 0; color:#555;">We'll prepare a personalized response</td>
              </tr>
              <tr>
                <td style="padding:8px 0; vertical-align:top;">
                  <span style="display:inline-block; width:28px; height:28px; background:#4caf50; color:white; text-align:center; line-height:28px; border-radius:50%; font-weight:bold;">3</span>
                </td>
                <td style="padding:8px 0; color:#555;">You'll receive a reply via email</td>
              </tr>
            </tbody>
          </table>

          <p style="color:#555; margin-top:15px;">If you have any urgent concerns, please don't hesitate to reach out to us directly.</p>
          
          <p style="color:#333; margin-top:15px;">Thank you for your patience! 💚</p>
        </div>

        <footer style="text-align:center; margin-top:25px; color:#2e7d32; font-size:13px;">
          💚 Powered by Healthcare System — Automated Notification<br>
          <span style="color:#666; font-size:11px;">This is an automated message. Please do not reply to this email.</span>
        </footer>
      </div>
    `;

    await sendEmail(userEmail, subject, htmlContent);
    console.log(`✅ Confirmation email sent to: ${userEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send confirmation email to ${userEmail}:`, error);
    throw error;
  }
};

/**
 * Notify admin about new contact form submission
 */
const sendAdminNotificationEmail = async (contactData) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.PROJECT_EMAIL;
    const subject = `🔔 New Contact Form — ${contactData.fullName}`;

    const htmlContent = `
      <div style="font-family: 'Poppins', Arial, sans-serif; background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 30px; border-radius: 16px; max-width:600px; margin:auto; box-shadow: 0 0 10px rgba(33,150,243,0.2);">
        
        <div style="text-align:center;">
          <h2 style="color:#1565c0; font-size:26px; margin-bottom:5px;">🔔 New Contact Form Submission</h2>
          <p style="color:#0d47a1; font-size:15px;">A new message requires your attention</p>
          <hr style="border:none; border-top:2px dashed #2196f3; width:60%; margin:18px auto;">
        </div>
        
        <div style="background:white; padding:20px; border-radius:14px; border:1px solid #90caf9;">
          
          <h3 style="color:#1565c0; font-size:18px; margin-top:0;">📋 Contact Details:</h3>

          <table style="width:100%; margin-top:10px; border-collapse:collapse;">
            <tbody>
              <tr>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd;"><strong style="color:#1565c0;">Full Name:</strong></td>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd;">${contactData.fullName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd;"><strong style="color:#1565c0;">Email:</strong></td>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd;"><a href="mailto:${contactData.email}" style="color:#2196f3; text-decoration:none;">${contactData.email}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd;"><strong style="color:#1565c0;">Phone:</strong></td>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd;">${contactData.phone || "Not provided"}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd;"><strong style="color:#1565c0;">Subject:</strong></td>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd;">${contactData.subject}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd;"><strong style="color:#1565c0;">Contact ID:</strong></td>
                <td style="padding:8px 0; border-bottom:1px solid #e3f2fd; font-family:monospace; font-size:12px;">${contactData.id}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;"><strong style="color:#1565c0;">Submitted:</strong></td>
                <td style="padding:8px 0;">${new Date(contactData.createdAt).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <h3 style="color:#1565c0; font-size:18px; margin-top:20px;">💬 Message:</h3>
          <div style="background:#f5f5f5; padding:15px; border-radius:8px; margin:10px 0; border-left:4px solid #2196f3; color:#333; line-height:1.6;">
            ${contactData.message.replace(/\n/g, "<br>")}
          </div>
          
          <div style="background:#fff3e0; padding:12px; border-radius:8px; margin-top:15px; border-left:4px solid #ff9800;">
            <p style="margin:0; color:#e65100;"><strong>⚡ Action Required:</strong> Please review and respond to this contact form at your earliest convenience.</p>
          </div>

          <div style="text-align:center; margin-top:20px;">
            <a href="#admin-panel" style="display:inline-block; background:#2196f3; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">View in Admin Panel</a>
          </div>
        </div>

        <footer style="text-align:center; margin-top:25px; color:#1565c0; font-size:13px;">
          🔔 Healthcare System — Admin Notification
        </footer>
      </div>
    `;

    await sendEmail(adminEmail, subject, htmlContent);
    console.log(`✅ Admin notification sent to: ${adminEmail}`);
  } catch (error) {
    console.error("❌ Failed to send admin notification:", error);
    throw error;
  }
};

/**
 * Send reply notification to user when admin replies
 */
const sendReplyNotificationEmail = async (contactData, adminReply, adminName) => {
  try {
    const subject = `💬 Response to: ${contactData.subject}`;

    const htmlContent = `
      <div style="font-family: 'Poppins', Arial, sans-serif; background: linear-gradient(135deg, #fff3e0, #ffe0b2); padding: 30px; border-radius: 16px; max-width:600px; margin:auto; box-shadow: 0 0 10px rgba(255,152,0,0.2);">
        
        <div style="text-align:center;">
          <h2 style="color:#e65100; font-size:26px; margin-bottom:5px;">💬 Response to Your Contact Form</h2>
          <p style="color:#bf360c; font-size:15px;">We've reviewed your message and here's our response</p>
          <hr style="border:none; border-top:2px dashed #ff9800; width:60%; margin:18px auto;">
        </div>
        
        <div style="background:white; padding:20px; border-radius:14px; border:1px solid #ffcc80;">
          
          <p style="color:#333; font-size:15px;">Dear <strong>${contactData.fullName}</strong>,</p>

          <p style="color:#555;">Thank you for reaching out to us. We have carefully reviewed your message and would like to respond:</p>

          <h3 style="color:#e65100; font-size:18px; margin-top:20px;">📬 Admin Response:</h3>
          <div style="background:#fff8e1; padding:18px; border-radius:10px; margin:15px 0; border-left:4px solid #ff9800; color:#333; line-height:1.7;">
            ${adminReply.replace(/\n/g, "<br>")}
          </div>
          
          <p style="text-align:right; color:#666; font-style:italic; margin-top:10px;">
            — ${adminName || "Healthcare Portal Team"}
          </p>

          <hr style="border:none; border-top:1px solid #ffe0b2; margin:25px 0;">

          <h3 style="color:#e65100; font-size:16px; margin-top:20px;">📝 Your Original Message:</h3>
          <div style="background:#f5f5f5; padding:15px; border-radius:8px; margin:10px 0; border-left:3px solid #bdbdbd;">
            <p style="margin:0 0 8px 0; color:#666;"><strong style="color:#333;">Subject:</strong> ${contactData.subject}</p>
            <p style="margin:0; color:#666;"><strong style="color:#333;">Message:</strong></p>
            <p style="margin:8px 0 0 0; color:#555; line-height:1.6;">${contactData.message.replace(/\n/g, "<br>")}</p>
          </div>
          
          <div style="background:#e8f5e9; padding:12px; border-radius:8px; margin-top:20px; border-left:4px solid #4caf50;">
            <p style="margin:0; color:#2e7d32;">💚 <strong>Need More Help?</strong> If you have any follow-up questions, please feel free to submit a new contact form or reply to this email.</p>
          </div>

          <p style="color:#555; margin-top:20px;">Thank you for choosing our healthcare services!</p>
        </div>

        <footer style="text-align:center; margin-top:25px; color:#e65100; font-size:13px;">
          💬 Healthcare System — We're Here to Help!
        </footer>
      </div>
    `;

    await sendEmail(contactData.email, subject, htmlContent);
    console.log(`✅ Reply notification sent to: ${contactData.email}`);
  } catch (error) {
    console.error(`❌ Failed to send reply notification to ${contactData.email}:`, error);
    throw error;
  }
};


module.exports = {
  sendBookingNotificationToDoctor,
  sendBookingResponseToPatient,
  sendContactConfirmationEmail,
  sendAdminNotificationEmail,
  sendReplyNotificationEmail,
};
