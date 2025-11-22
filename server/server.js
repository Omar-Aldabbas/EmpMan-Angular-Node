const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
// auth things
const bcrypt = require('bcryptjs');
const { generateToken } = require('./auth');

require("dotenv").config();

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "HR-System",
  password: process.env.DBPASS,
  port: 5432,
});

////////////////////////////////////////////////
//////////////auth//////////////////////////
//////////////////////////////////////////////

app.post('/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING user_id, username",
      [username, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Wrong password' });

    const token = generateToken(user);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


////////////////////////////////////////////////
//////////////department//////////////////////////
//////////////////////////////////////////////

app.get("/departments", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM departments");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.post("/departments", async (req, res) => {
  try {
    const depName = req.body.department_name;
    console.log(depName);
    const result = await pool.query(
      "INSERT INTO departments (department_name) VALUES ($1) RETURNING *",
      [depName]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.delete("/departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM departments WHERE department_id=$1", [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

////////////////////////////////////////////////
//////////////section//////////////////////////
//////////////////////////////////////////////
app.get("/sections", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sections");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.post("/sections", async (req, res) => {
  try {
    const secName = req.body.section_name;
    console.log(secName);
    const result = await pool.query(
      "INSERT INTO sections (section_name) VALUES ($1) RETURNING *",
      [secName]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.delete("/sections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM sections WHERE section_id=$1", [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

////////////////////////////////////////////////
//////////////employee//////////////////////////
//////////////////////////////////////////////

app.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(`  
       SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.hire_date,
        d.department_name,
        s.section_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN sections s ON e.section_id = s.section_id
      ORDER BY e.employee_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.get("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM employees WHERE employee_id=$1",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.post("/employees", async (req, res) => {
  try {
    const { first_name, last_name, email, phone, department_id, section_id } =
      req.body;
    const result = await pool.query(
      `INSERT INTO employees (first_name, last_name, email, phone, department_id, section_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, last_name, email, phone, department_id, section_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.put("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, department_id } = req.body;
    const result = await pool.query(
      `UPDATE employees 
       SET first_name=$1, last_name=$2, email=$3, phone=$4, department_id=$5
       WHERE employee_id=$6 RETURNING *`,
      [first_name, last_name, email, phone, department_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.delete("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM employees WHERE employee_id=$1", [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
