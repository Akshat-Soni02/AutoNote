import express from "express";
import dotenv from "dotenv";
import { google } from "googleapis";
import {appendToken} from "../middleware/authentication.ts";
import { GoogleGenAI } from "@google/genai";

// const auth = new google.auth.OAuth2({
//     clientId: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     redirectUri: process.env.GOOGLE_REDIRECT_URI,
//   });

  const auth = new google.auth.OAuth2();
  const docs = google.docs({ version: "v1", auth });
  
//   // Get this from the frontend after user logs in
//   auth.setCredentials({
//     access_token: "USER_ACCESS_TOKEN",
//     refresh_token: "USER_REFRESH_TOKEN", // optional but useful
//   });

dotenv.config();
const app = express();

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Server is running on port:",port);
});

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.get('/', (req, res) => {
    res.send('hello world');
})

app.post("/new-document",appendToken, async (req, res) => {
    try {
        const {title} = req.body;
        const access_token = req.token;
        auth.setCredentials({ access_token });
        const response = await docs.documents.create({
            requestBody: {
                title
            }
        });
        res.status(200).json({
            message: "successfully created doc",
            response
        });
    } catch (error) {
        res.status(400).json({message: "Error"+error});
    }
    
})

async function geminiRes(contents: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
  });
  return response?.text;
}

app.post("/write-section", appendToken, async (req, res) => {
    try {
      let { documentId, heading, paragraph } = req.body;
      const access_token = req.token;
      // console.log("here is the token", access_token);
  
      auth.setCredentials({ access_token });
  
      const doc = await docs.documents.get({ documentId });
      const lastElement = doc.data.body?.content?.slice(-1)[0];
      const endIndex = lastElement?.endIndex || 1;
      const insertIndex = Math.max(endIndex - 1, 1);
      console.log(endIndex);
      let summerizedPara = paragraph;
      if(paragraph) {
        summerizedPara = await geminiRes("summerize and also give a title for the para: " + paragraph);
      }
      // console.log(paragraph);
      const lines = summerizedPara.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      if (lines[0].startsWith("**Title:")) {
        heading = lines[0].replace("**Title:", "").replace("**", "").trim();
        paragraph = lines.slice(1).join(" ");
      } else {
        paragraph = summerizedPara;
      }

      const points = paragraph
      .split(/[.]/) // split based on comma
      .map(p => p.trim())
      .filter(p => p.length > 0);

  
      const textToInsert = `${heading}\n${points.join('\n')}\n\n`;
  
      const headingLength = heading.length + 1;
      const bulletsStart = endIndex + headingLength;
      const bulletsEnd = bulletsStart + points.join('\n').length;
  
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: insertIndex },
                text: textToInsert
              }
            },
            {
              updateParagraphStyle: {
                range: {
                  startIndex: insertIndex,
                  endIndex: endIndex + headingLength - 1
                },
                paragraphStyle: {
                  namedStyleType: "HEADING_2"
                },
                fields: "namedStyleType"
              }
            },
            {
              createParagraphBullets: {
                range: {
                  startIndex: bulletsStart,
                  endIndex: bulletsEnd
                },
                bulletPreset: "BULLET_DISC_CIRCLE_SQUARE"
              }
            }
          ]
        }
      });
  
      res.status(200).json({ message: "Section added successfully!" });
  
    } catch (error) {
      console.error("Google Docs write error:", error);
      res.status(500).json({ message: "Error: " + error.message });
    }
  });