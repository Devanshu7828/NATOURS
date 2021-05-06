const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");
//new Email(user,url).SENDWELCOME(); HOW WE GONNA USED IT

// module.exports = class Email {
//   constructor(user, url) {
//     this.to = user.email;
//     this.firstName = user.name.split(" ")[0];
//     this.url = url;
//     this.from = `Devanshu Rajak ${process.env.EMAIL_FROM}`;
//   }

//   newTransport() {
//     // if (process.env.NODE_ENV === "production") {
//     //   // SENDGRID
//     //   return nodemailer.createTransport({
//     //     service: 'SendGrid',
//     //     auth: {

//     //     }
//     //   })
//     // }
//     return nodemailer.createTransport({
//       service: "SendGrid",
//       auth: {
//         user: process.env.SENDGRID_USERNAME,
//         pass: process.env.SENDGRID_PASS,
//       },
//     });
//   }
//   // Send the actual eamil
//   async send(template, subject) {
//     //1) RENDER HTML BASED ON A PUG TEMPLATE
//     const html = pug.renderFile(
//       `${__dirname}/../views/emails/${template}.pug`,
//       {
//         firstName: this.firstName,
//         url: this.url,
//         subject,
//       }
//     );
//     //2)DEFINE EMAIL OPTIONS
//     const mailOptions = {
//       from: process.env.SENDGRID_FROM,
//       to: this.to,
//       subject,
//       html,
//       text: htmlToText.fromString(html),
//     };
//     //3) CREATE TRANSPORT AND EMAIL
//     // await transport.sendMail(mailOptions);

//     await this.newTransport().sendMail(mailOptions);
//   }
//   //spacifc funtction
//   async sendWelcome() {
//     await this.send("welcome", "Welcome to the natours family!");
//   }

//   async sendPasswordResetLink() {
//     await this.send(
//       "passwordReset",
//       "Your password reset token (valid for only 10 minutes"
//     );
//   }
// };


// module.exports = sendEmail;

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD,
      },
    });
    // return nodemailer.createTransport({
    //   host: process.env.EMAIL_HOST,
    //   port: process.env.EMAIL_PORT,
    //   auth: {
    //     user: process.env.EMAIL_USERNAME,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: process.env.SENDGRID_FROM,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours Family!");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
};
