// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});



const mailBtn = document.querySelector('.submit-btn');
mailBtn.addEventListener('click', (e) => {
    const nodemailer = require('nodemailer');

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-app-password' // Спеціальний пароль додатка
        }
    });

    let mailOptions = {
        from: 'your-email@gmail.com',
        to: 'recipient@mail.com',
        subject: 'Тестовий лист',
        text: 'Привіт із Node.js!'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Лист надіслано: ' + info.response);
    });
})
