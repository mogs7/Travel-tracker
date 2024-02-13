import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client({
  host: "localhost",
  user: "postgres",
  database: "world",
  password: "miguel123",
  port: 5432,
});

db.connect();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Create an async function to fetch visited countries data
async function getVisitedCountries(){
  //Obtain data
  let visitedCountries = [];
  const result = await db.query("SELECT * FROM visited_countries2")

  //Put country codes to array
  for (let i=0;i<result.rows.length;i++){
    visitedCountries.push(result.rows[i].country_code);
  }

  return visitedCountries;
}

app.get("/", async (req, res) => {
  const visitedCountries = await getVisitedCountries();
  console.log(visitedCountries);

  res.render("index.ejs", {
    countries: visitedCountries,
    total: visitedCountries.length
  })
});

app.post("/add", async (req,res) => {
  let addCountry = req.body.country; 
  console.log(addCountry.toLowerCase());

  //Obtain country code using db query and filter with user input
  try {
    const result =  await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [addCountry.toLowerCase()]);
    let visitedCountries = await getVisitedCountries();

    //Insert into database if input isn't empty
    if (result.rows.length !== 0 ){
      try {
        await db.query("INSERT INTO visited_countries2 (country_code) VALUES ($1)", [result.rows[0].country_code]);
        res.redirect("/");
      } catch (error){
        console.error("Error inserting into database: ", error);
        res.render("index.ejs", {
          error: error,
          countries: visitedCountries,
          total: visitedCountries.length
        });
      }
    } else {
      console.log("Returned null: ");
      res.render("index.ejs", {
        error: "Country does not exist",
        countries: visitedCountries,
        total: visitedCountries.length
      });
    }
  } catch (error) {
    console.error("Error selecting country: ", error);
  } 
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
