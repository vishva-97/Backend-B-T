const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const Twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure Twilio
const twilioClient = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Google Sheets Integration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json', // Service Account JSON File
    scopes: SCOPES,
});
const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

app.post('/submit', async (req, res) => {
    const { name, contact, vehicle, vehicleNumber, kilometers, remarks } = req.body;

    try {
        // Append data to Google Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:F',
            valueInputOption: 'RAW',
            requestBody: {
                values: [[name, contact, vehicle, vehicleNumber, kilometers, remarks, new Date().toISOString()]],
            },
        });

        // Send SMS via Twilio
        await twilioClient.messages.create({
            body: `Thank you, ${name}, for visiting Balaji Auto and Tyres! Your details are successfully saved.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact,
        });

        res.status(200).json({ message: 'Data submitted and SMS sent successfully.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to submit data.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
