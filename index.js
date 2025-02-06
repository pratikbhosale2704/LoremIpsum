const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const Busi = require("./models/busi.js");
const Msg = require("./models/message.js");
const methodOverride = require("method-override");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const fsp = require("fs").promises;
const fs = require("fs");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Import multer for handling file uploads
const multer = require("multer");
const User = require("./models/Users.js");

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

// Logout route
app.post("/logout", (req, res) => {
  res.clearCookie("authToken"); // Clear the auth token cookie
  res.redirect("/login"); // Redirect to the login page
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

// Gemini API endpoint and API key
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_API_KEY = "AIzaSyDAXwZ7VzChN5CdcOpH6OoHV4FRZXqrY5w"; // Replace with your actual API key

// Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user in the database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send("Invalid credentials");
    }

    // Compare password with the hashed one in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send("Invalid credentials");
    }

    // If password is valid, just send a success message or the user data
    // res.send("Login successful");
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Example of a protected route
app.get("/dashboard", (req, res) => {
  res.render("dashboard.ejs");
});
// app.get("/dashboard", async (req, res) => {
//   //   let busiId = req.params;
//   //   const business = await Busi.findById(busiId);
//   //   res.render("dashboard.ejs", { business });
//   res.render("dashboard.ejs");
//   //   res.send("data stored");
// });

// Sign Up Route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("Username already taken");
    }

    const newUser = new User({ username, password });
    await newUser.save();

    // res.status(201).send("User created successfully");
    res.redirect("/login");
  } catch (error) {
    console.error("Sign Up error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Middleware for protecting routes

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
                text: `Generate a marketing campaign for  : ${userInput} (dont give text in bold form not even headings and give required information in short )`,
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

// app.get("/dashboard", async (req, res) => {
//   //   let busiId = req.params;
//   //   const business = await Busi.findById(busiId);
//   //   res.render("dashboard.ejs", { business });
//   res.render("dashboard.ejs");
//   //   res.send("data stored");
// });

app.post("/home", async (req, res) => {
  let { name, email, msg } = req.body;
  let newMsg = new Msg({
    name: name,
    email: email,
    msg: msg,
    created_at: new Date(),
  });
  newMsg
    .save()
    .then(async (saveMsg) => {
      console.log("Message Sent");
      const id = await saveMsg._id; // Use the saveMsg object to get the _id
      res.redirect(`/home`);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error Sending Message");
    });
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

app.post(
  "/predict-campaign",
  upload.single("combinedData"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("The combined data file is required.");
      }

      // Read the uploaded file content
      const fileData = await fsp.readFile(req.file.path, "utf-8");

      // Call the Gemini API for predictions
      const predictionResult = await predictCampaignSuccess(fileData);

      // Render the prediction page with results
      res.render("prediction", { predictionResult });
    } catch (error) {
      console.error("Error processing prediction:", error);
      res.status(500).send("Failed to process prediction");
    }
  }
);

// Function to call the Gemini API for campaign predictions
async function predictCampaignSuccess(fileData) {
  try {
    // Construct prompt with actual file content
    const prompt = `Analyze the following combined campaign data and customer demographics to predict campaign success(answer only in one-two line):
    ${fileData}
    Provide a prediction score (0-100) and a brief explanation.`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // Validate API response
    if (
      !response.data ||
      !response.data.candidates ||
      response.data.candidates.length === 0
    ) {
      throw new Error("Invalid response from Gemini API");
    }

    return response.data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Prediction failed. Please try again.";
  }
}

app.post(
  "/predict-campaign",
  upload.single("combinedData"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("The combined data file is required.");
      }

      // ✅ FIXED: Correctly reading file content
      const fileData = await fsp.readFile(req.file.path, "utf-8");

      // Call Gemini API for predictions
      const predictionResult = await predictCampaignSuccess(fileData);

      // Render the prediction page with results
      res.render("prediction", { predictionResult });
    } catch (error) {
      console.error("Error processing prediction:", error);
      res.status(500).send("Failed to process prediction");
    }
  }
);

// app.post(
//   "/predict-retention",
//   upload.single("customerData"),
//   async (req, res) => {
//     try {
//       // Log the uploaded file for debugging
//       console.log("Uploaded file:", req.file);

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

// app.post(
//   "/predict-retention",
//   upload.single("customerData"),
//   async (req, res) => {
//     try {
//       console.log("Uploaded file:", req.file);

//       if (!req.file) {
//         return res.status(400).send("Please upload a valid file.");
//       }

//       if (req.file.mimetype !== "text/csv") {
//         return res.status(400).send("Please upload a valid CSV file.");
//       }

//       const customerDataPath = req.file.path;

//       // ✅ FIX: Convert CSV parsing into a Promise to ensure Express waits
//       const results = await parseCSV(customerDataPath);

//       // Call Gemini API for predictions
//       const predictionResult = await predictRetention(results);

//       // Render the retention page with results
//       res.render("retention", { predictionResult });
//     } catch (error) {
//       console.error("Error processing prediction:", error);
//       res.status(500).send("Failed to process prediction");
//     }
//   }
// );

// // ✅ Helper function to read CSV using Promises
// function parseCSV(filePath) {
//   return new Promise((resolve, reject) => {
//     const results = [];
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on("data", (data) => results.push(data))
//       .on("end", () => resolve(results))
//       .on("error", (error) => reject(error));
//   });
// }

// // Function to call the Gemini API for retention predictions
// async function predictRetention(data) {
//   try {
//     // Prepare the prompt for the Gemini API
//     const prompt = `Analyze the following customer data to predict engagement, churn likelihood, and generate retention strategies(answer only in one-two line):
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

app.post(
  "/predict-retention",
  upload.single("customerData"),
  async (req, res) => {
    try {
      console.log("Uploaded file:", req.file);

      if (!req.file) {
        return res.status(400).send("Please upload a valid file.");
      }

      if (req.file.mimetype !== "text/csv") {
        return res.status(400).send("Please upload a valid CSV file.");
      }

      const customerDataPath = req.file.path;

      // ✅ FIX: Convert CSV parsing into a Promise to ensure Express waits
      const results = await parseCSV(customerDataPath);

      console.log("Parsed CSV Data:", results); // ✅ Debugging log

      // Call Gemini API for predictions
      const predictionResult = await predictRetention(results);

      console.log("Prediction Result:", predictionResult); // ✅ Debugging log

      // Render the retention page with results
      res.render("retention", { predictionResult });
    } catch (error) {
      console.error("Error processing prediction:", error);
      res.status(500).send("Failed to process prediction");
    }
  }
);

// ✅ Helper function to read CSV using Promises
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        if (results.length === 0) {
          return reject(new Error("CSV file is empty or invalid"));
        }
        resolve(results);
      })
      .on("error", (error) => reject(error));
  });
}

// ✅ Function to call Gemini API for retention predictions
async function predictRetention(data) {
  try {
    // 🔹 Construct AI prompt
    // console.log("Data Sent to AI:", JSON.stringify(data, null, 2)); // ✅ Debugging log
    const prompt = `Analyze the following customer data to predict engagement, churn likelihood, and generate retention strategies (answer only in one-two lines):
    ${JSON.stringify(data, null, 2)}
    Provide the output strictly in this JSON format (without explanations or additional text):
    {
      "engagementScore": "A percentage score (0-100)",
      "churnLikelihood": "A percentage score (0-100)",
      "retentionStrategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
    }`;

    // 🔹 Make API request
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // 🔹 Check if AI response is valid
    if (!response.data?.candidates?.length) {
      throw new Error("Invalid response from Gemini API");
    }

    const aiOutput = response.data.candidates[0].content.parts[0].text.trim();
    console.log("Raw AI Output:", aiOutput); // ✅ Debugging log

    let predictionResult;
    try {
      // ✅ Attempt to parse AI response as JSON
      predictionResult = JSON.parse(aiOutput);
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError);

      // 🔹 Fallback Strategy Extraction
      const strategiesMatch = aiOutput.match(/"(.*?)"/g);
      const extractedStrategies = strategiesMatch
        ? strategiesMatch.map((s) => s.replace(/"/g, ""))
        : [];

      predictionResult = {
        engagementScore: "N/A",
        churnLikelihood: "N/A",
        retentionStrategies: extractedStrategies.length
          ? extractedStrategies
          : ["Unable to extract valid strategies."],
      };
    }

    return predictionResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { error: "Prediction failed. Please try again." };
  }
}
