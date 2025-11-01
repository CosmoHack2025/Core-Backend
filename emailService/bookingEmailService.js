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

module.exports = {
  sendBookingNotificationToDoctor,
  sendBookingResponseToPatient,
};
