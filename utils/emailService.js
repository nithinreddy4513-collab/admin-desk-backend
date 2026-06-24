import nodemailer from "nodemailer";

/**
 * Create email transporter
 * Uses environment variables for configuration
 * Supports Gmail, SendGrid, or other SMTP providers
 */
const getTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD to enable notifications.");
    return null;
  }

  // Gmail SMTP configuration
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send ticket assigned email notification
 * @param {string} assigneeEmail - Email of the assigned agent
 * @param {string} assigneeName - Name of the assigned agent
 * @param {object} ticket - Ticket object with id, title, priority, status
 * @param {string} assignedByName - Name of the person who assigned the ticket
 */
export const sendTicketAssignedEmail = async (assigneeEmail, assigneeName, ticket, assignedByName) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log("Email service disabled. Skipping ticket assigned notification.");
      return;
    }

    const priorityColor = {
      low: "green",
      medium: "orange",
      high: "red",
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: assigneeEmail,
      subject: `🎫 New Ticket Assigned: ${ticket.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">New Ticket Assigned</h2>
            <p style="color: #666; font-size: 16px;">Hi ${assigneeName},</p>
            <p style="color: #666; font-size: 16px;">A new ticket has been assigned to you by <strong>${assignedByName}</strong>. Please review and take action.</p>
          </div>

          <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666; width: 30%;">Ticket ID:</td>
                <td style="padding: 12px; color: #333;">${ticket.id}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666;">Title:</td>
                <td style="padding: 12px; color: #333;">${ticket.title}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666;">Priority:</td>
                <td style="padding: 12px;">
                  <span style="display: inline-block; padding: 4px 8px; background-color: ${priorityColor[ticket.priority]}; color: white; border-radius: 4px; font-weight: bold; font-size: 12px;">
                    ${ticket.priority?.toUpperCase() || "N/A"}
                  </span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666;">Status:</td>
                <td style="padding: 12px; color: #333;">${ticket.status?.toUpperCase() || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold; color: #666;">Created:</td>
                <td style="padding: 12px; color: #333;">${new Date(ticket.createdAt).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #333;">
              <a href="${process.env.FRONTEND_URL || "https://admin-desk-frontend.netlify.app"}/tickets/${ticket.id}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Ticket in Dashboard →
              </a>
            </p>
          </div>

          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>This is an automated notification from Admin Desk Ticketing System.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️  Ticket assigned email sent to ${assigneeEmail}`);
  } catch (error) {
    console.error("Failed to send ticket assigned email:", error.message);
    // Don't throw - email failure shouldn't break the API
  }
};

/**
 * Send ticket reassigned email notification
 * @param {string} newAssigneeEmail - Email of the new assignee
 * @param {string} newAssigneeName - Name of the new assignee
 * @param {string} previousAssigneeName - Name of the previous assignee
 * @param {object} ticket - Ticket object
 * @param {string} reassignedByName - Name of person who reassigned
 */
export const sendTicketReassignedEmail = async (
  newAssigneeEmail,
  newAssigneeName,
  previousAssigneeName,
  ticket,
  reassignedByName
) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log("Email service disabled. Skipping ticket reassigned notification.");
      return;
    }

    const priorityColor = {
      low: "green",
      medium: "orange",
      high: "red",
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: newAssigneeEmail,
      subject: `🔄 Ticket Reassigned: ${ticket.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Ticket Reassigned to You</h2>
            <p style="color: #666; font-size: 16px;">Hi ${newAssigneeName},</p>
            <p style="color: #666; font-size: 16px;">A ticket has been reassigned to you from <strong>${previousAssigneeName}</strong> by <strong>${reassignedByName}</strong>.</p>
          </div>

          <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666; width: 30%;">Ticket ID:</td>
                <td style="padding: 12px; color: #333;">${ticket.id}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666;">Title:</td>
                <td style="padding: 12px; color: #333;">${ticket.title}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666;">Priority:</td>
                <td style="padding: 12px;">
                  <span style="display: inline-block; padding: 4px 8px; background-color: ${priorityColor[ticket.priority]}; color: white; border-radius: 4px; font-weight: bold; font-size: 12px;">
                    ${ticket.priority?.toUpperCase() || "N/A"}
                  </span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666;">Status:</td>
                <td style="padding: 12px; color: #333;">${ticket.status?.toUpperCase() || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold; color: #666;">Created:</td>
                <td style="padding: 12px; color: #333;">${new Date(ticket.createdAt).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #333;">
              <a href="${process.env.FRONTEND_URL || "https://admin-desk-frontend.netlify.app"}/tickets/${ticket.id}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Ticket in Dashboard →
              </a>
            </p>
          </div>

          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>This is an automated notification from Admin Desk Ticketing System.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️  Ticket reassigned email sent to ${newAssigneeEmail}`);
  } catch (error) {
    console.error("Failed to send ticket reassigned email:", error.message);
  }
};

/**
 * Send ticket resolved email notification
 * @param {string} creatorEmail - Email of ticket creator
 * @param {string} creatorName - Name of ticket creator
 * @param {object} ticket - Ticket object
 * @param {string} resolvedByName - Name of person who resolved it
 */
export const sendTicketResolvedEmail = async (creatorEmail, creatorName, ticket, resolvedByName) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log("Email service disabled. Skipping ticket resolved notification.");
      return;
    }

    const priorityColor = {
      low: "green",
      medium: "orange",
      high: "red",
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: creatorEmail,
      subject: `✅ Ticket Resolved: ${ticket.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #28a745; margin-top: 0;">✅ Ticket Resolved</h2>
            <p style="color: #666; font-size: 16px;">Hi ${creatorName},</p>
            <p style="color: #666; font-size: 16px;">Good news! Your ticket has been resolved by <strong>${resolvedByName}</strong>. If you have any follow-up questions, please reply to this email.</p>
          </div>

          <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666; width: 30%;">Ticket ID:</td>
                <td style="padding: 12px; color: #333;">${ticket.id}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666;">Title:</td>
                <td style="padding: 12px; color: #333;">${ticket.title}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666;">Priority:</td>
                <td style="padding: 12px;">
                  <span style="display: inline-block; padding: 4px 8px; background-color: ${priorityColor[ticket.priority]}; color: white; border-radius: 4px; font-weight: bold; font-size: 12px;">
                    ${ticket.priority?.toUpperCase() || "N/A"}
                  </span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #666;">Status:</td>
                <td style="padding: 12px;">
                  <span style="display: inline-block; padding: 4px 8px; background-color: #28a745; color: white; border-radius: 4px; font-weight: bold; font-size: 12px;">
                    RESOLVED
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold; color: #666;">Resolved:</td>
                <td style="padding: 12px; color: #333;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #333;">
              <a href="${process.env.FRONTEND_URL || "https://admin-desk-frontend.netlify.app"}/tickets/${ticket.id}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Resolved Ticket →
              </a>
            </p>
          </div>

          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>This is an automated notification from Admin Desk Ticketing System.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️  Ticket resolved email sent to ${creatorEmail}`);
  } catch (error) {
    console.error("Failed to send ticket resolved email:", error.message);
  }
};
