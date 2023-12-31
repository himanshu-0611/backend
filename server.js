const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Enable CORS for all routes (you can adjust the options as needed)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://ec2-43-204-105-124.ap-south-1.compute.amazonaws.com",
    ],
    credentials: true,
  })
);


// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "rootpassword", // Replace with your MySQL password
  database: "dc_schema",
});
// const db = mysql.createConnection({
//   host: "dc-schema.czm46ec6i16c.ap-south-1.rds.amazonaws.com",
//   user: "root",
//   password: "rootpassword", // Replace with your MySQL password
//   database: "dc_schema",
//   port: 3306
// });

db.connect((err) => {
  if (err) {
    console.error("Database connection error: " + err.stack);
    return;
  }
  console.log("Connected to database as id " + db.threadId);
});

// Signup Route
app.post("/api/signup", async (req, res) => {
  const {
    user_name,
    user_mailid,
    user_password,
    batch_no,
    user_lang,
    program,
  } = req.body;

  console.log(req.body);

  if (!user_name || !user_mailid || !user_password) {
    return res.status(400).send("Invalid input data");
  }

  // Check if the user_mailid already exists in the database
  const checkEmailQuery =
    "SELECT user_id, COUNT(*) AS count FROM user_details WHERE user_mailid = ?";

  db.query(checkEmailQuery, [user_mailid], async (err, results) => {
    if (err) {
      console.error("Error checking email existence: " + err.message);
      res.status(500).send("Error checking email existence");
      return;
    }

    console.log("will check if em ex");

    const emailExists = results[0].count > 0;

    if (emailExists) {
      const existingUserId = results[0].user_id;

      console.log(program + user_lang);
      // Email already exists, return an error response
      let programId = null;
      if (program === "DSA" && user_lang === "C++") {
        programId = 6;
      } else if (program === "MERN") {
        programId = 2;
      } else if (program === "PlacementRun" && user_lang === "C++") {
        programId = 3;
      } else if (program === "PlacementRun" && user_lang === "Java") {
        programId = 4;
      } else if (program === "PlacementRun" && user_lang === "Python") {
        programId = 5;
      } else if (program === "DSA" && user_lang === "Java") {
        programId = 7;
      } else if (program === "DSA" && user_lang === "Python") {
        programId = 8;
      }
      if (programId === null) {
        return res.status(400).send("Invalid program");
      }

      console.log("now inserting vals in userprog");

      const insertProgressQuery =
        "INSERT INTO user_progress (p_user_id, p_user_name, user_lang, task_id, streak, program_id, p_batch_no) VALUES (?, ?, ?, 0, 0, ?, ?)";

      db.query(
        insertProgressQuery,
        [existingUserId, user_name, user_lang, programId, batch_no],
        (progressErr) => {
          if (progressErr) {
            console.error(
              "Error updating progress table: " + progressErr.message
            );
            res.status(500).send("Error updating progress table");
            return;
          }

          res.status(200).send({ msg: "Signup successful" });
        }
      );
    } else {
      // Email does not exist, proceed with inserting the new record
      try {
        const hashedPassword = await bcrypt.hash(user_password, 10);

        const insertUserQuery =
          "INSERT INTO user_details (user_name, user_mailid, user_password, batch_no) VALUES (?, ?, ?, ?)";

        db.query(
          insertUserQuery,
          [user_name, user_mailid, hashedPassword, batch_no],
          (err, userResult) => {
            if (err) {
              console.error("Signup error: " + err.message);
              res.status(500).send("Error signing up");
              return;
            }

            let programId = null;
            if (program === "DSA" && user_lang === "C++") {
              programId = 6;
            } else if (program === "MERN") {
              programId = 2;
            } else if (program === "PlacementRun" && user_lang === "C++") {
              programId = 3;
            } else if (program === "PlacementRun" && user_lang === "Java") {
              programId = 4;
            } else if (program === "PlacementRun" && user_lang === "Python") {
              programId = 5;
            } else if (program === "DSA" && user_lang === "Java") {
              programId = 7;
            } else if (program === "DSA" && user_lang === "Python") {
              programId = 8;
            }

            console.log(program + " " + user_lang + " " + programId);

            if (programId === null) return;

            const userId = userResult.insertId;

            // Insert a corresponding record into the progress table
            const insertProgressQuery =
              "INSERT INTO user_progress (p_user_id, p_user_name, user_lang, task_id, streak, program_id, p_batch_no) VALUES (?, ?, ?, 0, 0, ?, ?)";

            db.query(
              insertProgressQuery,
              [userId, user_name, user_lang, programId, batch_no],
              (progressErr) => {
                if (progressErr) {
                  console.error(
                    "Error updating progress table: " + progressErr.message
                  );
                  // Handle the error and potentially roll back the user registration
                  res.status(500).send("Error updating progress table");
                  return;
                }

                let programId = null;
                if (program === "DSA" && user_lang === "C++") {
                  programId = 6;
                } else if (program === "MERN") {
                  programId = 2;
                } else if (program === "PlacementRun" && user_lang === "C++") {
                  programId = 3;
                } else if (program === "PlacementRun" && user_lang === "Java") {
                  programId = 4;
                } else if (
                  program === "PlacementRun" &&
                  user_lang === "Python"
                ) {
                  programId = 5;
                } else if (program === "DSA" && user_lang === "Java") {
                  programId = 7;
                } else if (program === "DSA" && user_lang === "Python") {
                  programId = 8;
                }

                if (programId === null) return;

                console.log("User registered with ID: " + userId);
                res.status(200).send({ msg: "Signup successful" });
              }
            );
          }
        );
      } catch (error) {
        console.error("Password hashing error: " + error.message);
        res.status(500).send("Error signing up");
      }
    }
  });
});

// Login Route
app.post("/api/login", async (req, res) => {
  const { user_mailid, user_password } = req.body;

  // Check if the email exists in the database
  const checkEmailQuery = "SELECT * FROM user_details WHERE user_mailid = ?";

  db.query(checkEmailQuery, [user_mailid], (err, results) => {
    if (err) {
      console.error("Login error: " + err.message);
      res.status(500).send("Error logging in");
      return;
    }

    if (results.length === 0) {
      // No such user exists, return a 404 status code
      res.status(404).send("Login failed. No such user exists.");
      return;
    }

    // Now check the password
    const user = results[0];
    bcrypt.compare(user_password, user.user_password, (err, passwordMatch) => {
      if (err) {
        console.error("Password comparison error: " + err.message);
        res.status(500).send("Error logging in");
        return;
      }

      if (passwordMatch) {
        // Passwords match, login successful
        const userData = {
          user_id: user.user_id,
          user_name: user.user_name, // Include the user's name
          batch_no: user.batch_no,
        };
        res.status(200).json(userData); // Send user data as JSON
      } else {
        // Incorrect password, return a 401 status code
        res.status(401).send("Login failed. Incorrect user credentials.");
      }
    });
  });
});

app.post("/api/submitTask/:userId/:programId/:batch_no/:taskId", (req, res) => {
  const { userId, programId, batch_no, taskId } = req.params;

  // Use db.query for MySQL queries
  db.query(
    "SELECT * FROM user_progress WHERE p_user_id = ? AND program_id = ? AND p_batch_no = ?",
    [userId, programId, batch_no],
    (error, result) => {
      if (error) {
        console.error("Error selecting from MySQL:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User and program combination not found",
        });
      } else {
        db.query(
          "UPDATE user_progress SET task_id = ? WHERE p_user_id = ? AND program_id = ?",
          [taskId, userId, programId],
          (updateError, updateResult) => {
            if (updateError) {
              console.error("Error updating MySQL:", updateError);
              return res.status(500).json({
                success: false,
                message: "Internal server error",
              });
            }

            return res.status(200).json({
              success: true,
              message: "Task submitted successfully",
              data: updateResult,
            });
          }
        );
      }
    }
  );
});

/// API route to fetch user progress based on userId
app.get("/api/getUserProgress/:userId/:selectedProgram", (req, res) => {
  try {
    // Extract userId and selectedProgram from the URL parameters
    const userId = req.params.userId;
    const programId = req.params.selectedProgram;

    // Ensure programId is treated as an integer
    const parsedProgramId = parseInt(programId);

    // Check if parsedProgramId is a valid number
    if (isNaN(parsedProgramId)) {
      res.status(400).json({ error: "Invalid programId" });
      return;
    }

    // Your existing code for querying the database goes here...
    const getUserProgressQuery = `
      SELECT *
      FROM user_progress
      WHERE p_user_id = ?
      AND program_id = ?
    `;

    db.query(
      getUserProgressQuery,
      [userId, parsedProgramId],
      (err, results) => {
        if (err) {
          console.error("Error fetching user progress: " + err.message);
          res.status(500).json({ error: "Error fetching user progress" });
          return;
        }

        if (results.length === 0) {
          res.status(404).json({ error: "User progress not found" });
          return;
        }

        res.json(results);
      }
    );
  } catch (error) {
    console.error("Error in getUserProgress route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API route to handle task submission

app.post("/api/submitTask", (req, res) => {
  const { userId, selectedProgram, datetime, taskText } = req.body;

  // Insert the data into your database
  const insertQuery =
    "INSERT INTO userTasks (t_user_id, t_program_id, datetime, taskMessage) VALUES (?, ?, ?, ?)";

  db.query(
    insertQuery,
    [userId, selectedProgram, datetime, taskText],
    (err, result) => {
      if (err) {
        console.error("Error inserting data: " + err.message);
        res.status(500).json({ error: "Task submission failed" });
      } else {
        res.status(200).json({ message: "Task submitted successfully" });
      }
    }
  );
});

app.delete("/api/deleteLastTask", (req, res) => {
  // Delete the last submitted task from your database
  const deleteQuery = "DELETE FROM userTasks ORDER BY datetime DESC LIMIT 1";

  db.query(deleteQuery, (err, result) => {
    if (err) {
      console.error("Error deleting last task: " + err.message);
      res.status(500).json({ error: "Last task deletion failed" });
    } else {
      res.status(200).json({ message: "Last task deleted successfully" });
    }
  });
});

app.get("/api/userTasks", (req, res) => {
  const userId = req.query.userId;
  const programId = req.query.programId;

  // Retrieve user tasks from your database based on userId and programId
  const query =
    "SELECT taskMessage, datetime FROM userTasks WHERE t_user_id = ? AND t_program_id = ?";

  db.query(query, [userId, programId], (err, result) => {
    if (err) {
      console.error("Error fetching user tasks: " + err.message);
      res.status(500).json({ error: "Error fetching user tasks" });
    } else {
      res.status(200).json(result);
    }
  });
});

app.get("/api/leaderboard/:batch_no/:program_id", (req, res) => {
  const { batch_no, program_id } = req.params;

  // Use db.query for MySQL queries
  db.query(
    "SELECT * FROM user_progress WHERE p_batch_no = ? AND program_id = ?",
    [batch_no, program_id],
    (error, result) => {
      if (error) {
        console.error("Error fetching data from MySQL:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
