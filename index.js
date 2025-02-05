const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const Busi = require("./models/busi.js");
const methodOverride = require("method-override");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const csv = require("csv-parser");
// Import multer for handling file uploads
const multer = require("multer");

// Set up file upload middleware
const upload = multer({ dest: "uploads/" });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(bodyParser.json());

main()
  .then(() => {
    console.log("connection successful");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/marketing");
}

// // Replace with your AI model API endpoint
// const AI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"; // Example: OpenAI API

// // Replace with your AI model API key
// const AI_API_KEY = "AIzaSyDAXwZ7VzChN5CdcOpH6OoHV4FRZXqrY5w"; // Replace with your actual API key

// // Route to handle requests from the frontend
// app.post("/predict", async (req, res) => {
//   try {
//     const userInput = req.body.input; // Get input from the frontend

//     // Call the AI model API (e.g., OpenAI)
//     const response = await axios.post(
//       AI_API_URL,
//       {
//         model: "text-davinci-003", // Example: OpenAI model
//         prompt: `Generate a marketing campaign for: ${userInput}`, // Customize the prompt
//         max_tokens: 150, // Adjust based on your needs
//         temperature: 0.7, // Adjust creativity level
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${AI_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Extract the AI model's output
//     const aiOutput = response.data.choices[0].text.trim();

//     // Send the output back to the frontend
//     res.json({ prediction: aiOutput });
//   } catch (error) {
//     console.error("Error calling AI model API:", error);
//     res.status(500).json({ error: "Failed to process request" });
//   }
// });

// Gemini API endpoint and API key
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_API_KEY = "AIzaSyDAXwZ7VzChN5CdcOpH6OoHV4FRZXqrY5w"; // Replace with your actual API key

// Route to render the Predictive Insights page
app.get("/prediction", (req, res) => {
  res.render("prediction.ejs", { predictionResult: null }); // Render prediction.ejs
});

// Route to handle requests from the frontend
app.post("/predict", async (req, res) => {
  try {
    const userInput = req.body.input; // Get input from the frontend

    // Call the Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Generate a marketing campaign for: ${userInput}`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the AI model's output
    const aiOutput = response.data.candidates[0].content.parts[0].text.trim();

    // Send the output back to the frontend
    res.json({ prediction: aiOutput });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

app.get("/personalizedCamp", async (req, res) => {
  res.render("personalizedCamp.ejs");
});

app.get("/dashboard", async (req, res) => {
  //   let busiId = req.params;
  //   const business = await Busi.findById(busiId);
  //   res.render("dashboard.ejs", { business });
  res.render("dashboard.ejs");
  //   res.send("data stored");
});

// adding business details
app.post("/dashboard", (req, res) => {
  let { businame, busitype, busidescri } = req.body;
  //   let busitype = req.body["busitype"];
  //   console.log(busitype);
  let newBusi = new Busi({
    businame: businame,
    busitype: busitype,
    busidescri: busidescri,
    created_at: new Date(),
  });

  //   newBusi
  //     .save()
  //     .then((res) => {
  //       console.log("Business was added");
  //       const id = newBusi._id;
  //     })
  //     .catch((err) => console.log(err));

  //   res.redirect(`/dashboard/${id}`);

  newBusi
    .save()
    .then(async (savedBusi) => {
      console.log("Business was added");
      const id = await savedBusi._id; // Use the savedBusi object to get the _id
      res.redirect(`/dashboard`);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error saving business");
    });
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});
app.get("/pricing", (req, res) => {
  res.render("pricing.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/home", (req, res) => {
  //   res.send("Youre on homepage");
  res.render("home.ejs");
});

app.get("/", (req, res) => {
  res.send("root is working");
});

app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});

// Add the following code at the end of your existing file

// // Route to handle file uploads and generate predictions
// app.post(
//   "/predict-campaign",
//   upload.fields([
//     { name: "campaignData", maxCount: 1 },
//     { name: "customerDemographics", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       // Process the uploaded files
//       const campaignDataPath = req.files["campaignData"][0].path;
//       const customerDemographicsPath =
//         req.files["customerDemographics"][0].path;

//       // Call the Gemini API to generate predictions
//       const predictionResult = await predictCampaignSuccess(
//         campaignDataPath,
//         customerDemographicsPath
//       );

//       // Render the prediction page with the prediction result
//       res.render("prediction", { predictionResult });
//     } catch (error) {
//       console.error("Error processing prediction:", error);
//       res.status(500).send("Failed to process prediction");
//     }
//   }
// );

// // Function to call the Gemini API for predictions
// async function predictCampaignSuccess(
//   campaignDataPath,
//   customerDemographicsPath
// ) {
//   try {
//     // Simulate processing the uploaded files (replace with actual logic)
//     const prompt = `Analyze the following campaign data and customer demographics to predict campaign success:
//       - Campaign Data: ${campaignDataPath}
//       - Customer Demographics: ${customerDemographicsPath}
//       Provide a prediction score (0-100) and a brief explanation.`;

//     const response = await axios.post(
//       `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             parts: [
//               {
//                 text: prompt,
//               },
//             ],
//           },
//         ],
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Extract the AI model's output
//     const aiOutput = response.data.candidates[0].content.parts[0].text.trim();
//     return aiOutput; // Return the prediction result
//   } catch (error) {
//     console.error("Error calling Gemini API:", error);
//     throw error;
//   }
// }

// Route to render the retention page
app.get("/retention", (req, res) => {
  res.render("retention.ejs", { predictionResult: null });
});

// // Route to handle file uploads and generate predictions
// app.post(
//   "/predict-retention",
//   upload.single("customerData"),
//   async (req, res) => {
//     try {
//       const customerDataPath = req.file.path;

//       // Validate file type
//       if (req.file.mimetype !== "text/csv") {
//         return res.status(400).send("Please upload a valid CSV file.");
//       }

//       // Read and process the CSV file
//       const results = [];
//       fs.createReadStream(customerDataPath)
//         .pipe(csv())
//         .on("data", (data) => results.push(data))
//         .on("end", async () => {
//           // Call the Gemini API to generate predictions
//           const predictionResult = await predictRetention(results);

//           // Render the retention page with the prediction result
//           res.render("retention", { predictionResult });
//         });
//     } catch (error) {
//       console.error("Error processing prediction:", error);
//       res.status(500).send("Failed to process prediction");
//     }
//   }
// );

// // Function to call the Gemini API for predictions
// async function predictRetention(data) {
//   try {
//     // Prepare the prompt for the Gemini API
//     const prompt = `Analyze the following customer data to predict engagement, churn likelihood, and generate retention strategies:
//       ${JSON.stringify(data)}
//       Provide the output in the following JSON format:
//       {
//         "engagementScore": "A percentage score (0-100)",
//         "churnLikelihood": "A percentage score (0-100)",
//         "retentionStrategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
//       }`;

//     const response = await axios.post(
//       `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             parts: [
//               {
//                 text: prompt,
//               },
//             ],
//           },
//         ],
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Extract the AI model's output
//     const aiOutput = response.data.candidates[0].content.parts[0].text.trim();

//     // Parse the AI output into a JSON object
//     const predictionResult = JSON.parse(aiOutput);
//     return predictionResult;
//   } catch (error) {
//     console.error("Error calling Gemini API:", error);
//     throw error;
//   }
// }

// // Route to handle file uploads and generate predictions
// app.post(
//   "/predict-campaign",
//   upload.fields([
//     // Accepts multiple file uploads
//     { name: "campaignData", maxCount: 1 },
//     { name: "customerDemographics", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       // Check if files are uploaded
//       if (!req.files["campaignData"] || !req.files["customerDemographics"]) {
//         return res.status(400).send("Both files are required.");
//       }

//       // Process the uploaded files
//       const campaignDataPath = req.files["campaignData"][0].path;
//       const customerDemographicsPath =
//         req.files["customerDemographics"][0].path;

//       // Call the Gemini API to generate predictions
//       const predictionResult = await predictCampaignSuccess(
//         campaignDataPath,
//         customerDemographicsPath
//       );

//       // Render the prediction page with the prediction result
//       res.render("prediction", { predictionResult });
//     } catch (error) {
//       console.error("Error processing prediction:", error);
//       res.status(500).send("Failed to process prediction");
//     }
//   }
// );

// // Function to call the Gemini API for campaign predictions
// async function predictCampaignSuccess(
//   campaignDataPath,
//   customerDemographicsPath
// ) {
//   try {
//     // Simulate processing the uploaded files (replace with actual logic)
//     const prompt = `Analyze the following campaign data and customer demographics to predict campaign success:
//       - Campaign Data: ${campaignDataPath}
//       - Customer Demographics: ${customerDemographicsPath}
//       Provide a prediction score (0-100) and a brief explanation.`;

//     const response = await axios.post(
//       `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             parts: [
//               {
//                 text: prompt,
//               },
//             ],
//           },
//         ],
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Extract the AI model's output
//     const aiOutput = response.data.candidates[0].content.parts[0].text.trim();
//     return aiOutput; // Return the prediction result
//   } catch (error) {
//     console.error("Error calling Gemini API:", error);
//     throw error;
//   }
// }

app.post(
  "/predict-campaign",
  upload.single("combinedData"), // Accepts a single file named 'combinedData'
  async (req, res) => {
    try {
      // Check if the file is uploaded
      if (!req.file) {
        return res.status(400).send("The combined data file is required.");
      }

      // Process the uploaded file
      const combinedDataPath = req.file.path; // Path to the uploaded file

      // Call the Gemini API to generate predictions
      const predictionResult = await predictCampaignSuccess(combinedDataPath);

      // Render the prediction page with the prediction result
      res.render("prediction", { predictionResult });
    } catch (error) {
      console.error("Error processing prediction:", error);
      res.status(500).send("Failed to process prediction");
    }
  }
);

// Function to call the Gemini API for campaign predictions
async function predictCampaignSuccess(combinedDataPath) {
  try {
    // Simulate processing the uploaded file (replace with actual logic)
    const prompt = `Analyze the following combined campaign data and customer demographics to predict campaign success:
      - Combined Data: ${combinedDataPath}
      Provide a prediction score (0-100) and a brief explanation.`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the AI model's output
    const aiOutput = response.data.candidates[0].content.parts[0].text.trim();
    return aiOutput; // Return the prediction result
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

// Route to handle file uploads for retention prediction
// app.post(
//   "/predict-retention",
//   upload.single("customerData"),
//   async (req, res) => {
//     try {
//       // Check if file is uploaded
//       if (!req.file) {
//         return res.status(400).send("Please upload a valid file.");
//       }

//       const customerDataPath = req.file.path;

//       // Validate file type
//       if (req.file.mimetype !== "text/csv") {
//         return res.status(400).send("Please upload a valid CSV file.");
//       }

//       // Read and process the CSV file
//       const results = [];
//       fs.createReadStream(customerDataPath)
//         .pipe(csv())
//         .on("data", (data) => results.push(data))
//         .on("end", async () => {
//           // Call the Gemini API to generate retention predictions
//           const predictionResult = await predictRetention(results);

//           // Render the retention page with the prediction result
//           res.render("retention", { predictionResult });
//         });
//     } catch (error) {
//       console.error("Error processing prediction:", error);
//       res.status(500).send("Failed to process prediction");
//     }
//   }
// );

app.post(
  "/predict-retention",
  upload.single("customerData"),
  async (req, res) => {
    try {
      // Log the uploaded file for debugging
      console.log("Uploaded file:", req.file);

      // Check if file is uploaded
      if (!req.file) {
        return res.status(400).send("Please upload a valid file.");
      }

      const customerDataPath = req.file.path;

      // Validate file type
      if (req.file.mimetype !== "text/csv") {
        return res.status(400).send("Please upload a valid CSV file.");
      }

      // Read and process the CSV file
      const results = [];
      fs.createReadStream(customerDataPath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          // Call the Gemini API to generate retention predictions
          const predictionResult = await predictRetention(results);

          // Render the retention page with the prediction result
          res.render("retention", { predictionResult });
        });
    } catch (error) {
      console.error("Error processing prediction:", error);
      res.status(500).send("Failed to process prediction");
    }
  }
);

// Function to call the Gemini API for retention predictions
async function predictRetention(data) {
  try {
    // Prepare the prompt for the Gemini API
    const prompt = `Analyze the following customer data to predict engagement, churn likelihood, and generate retention strategies:
      ${JSON.stringify(data)}
      Provide the output in the following JSON format:
      {
        "engagementScore": "A percentage score (0-100)",
        "churnLikelihood": "A percentage score (0-100)",
        "retentionStrategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
      }`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the AI model's output
    const aiOutput = response.data.candidates[0].content.parts[0].text.trim();

    // Parse the AI output into a JSON object
    const predictionResult = JSON.parse(aiOutput);
    return predictionResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
