// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Require all models
var db = require("./models/");

// Require Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

//Set the listeningport
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Use morgan and body parser 
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

// Database configuration with mongoose
// mongoose.connect("mongodb://heroku_jmv816f9:5j1nd4taq42hi29bfm5hobeujd@ds133192.mlab.com:33192/heroku_jmv816f9");

mongoose.connect("mongodb://localhost/mongoscraper");

// Test connection to MongoDB
var dbConnect = mongoose.connection;

// If ERROR
dbConnect.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

//If connected, log a success message on the console
dbConnect.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes

// HTML Routes
//GET requests to render Homepage
app.get("/", function(req, res) {
  db.Article.find({"saved": false}, function(error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("home", hbsObject);
  });
});
//GET requests to render Saved Articles
app.get("/saved", function(req, res) {
  db.Article.find({"saved": true}).populate("Commentss").exec(function(error, articles) {
    var hbsObject = {
      article: articles
    };
    res.render("saved", hbsObject);
  });
});

// A GET request to scrape the Nytimes website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("https://www.nytimes.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $("article").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the title and summary of every link, and save them as properties of the result object
      result.title = $(this).children("h2").text();
      result.summary = $(this).children(".summary").text();
      result.link = $(this).children("h2").children("a").attr("href");

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    }); 
     // Tell the browser that we finished scraping the text
        res.send("Scrape Complete");
  });
});



// GET the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the Commentss associated with it
  .populate("Comments")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Save an article
app.post("/articles/save/:id", function(req, res) {
      // Use the article id to find and update its saved boolean
      Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
});

// Delete an article
app.post("/articles/delete/:id", function(req, res) {
      // Use the article id to find and update its saved boolean
      Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "Commentss": []})
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
});

// Create a new Comments
app.post("/Commentss/save/:id", function(req, res) {
  // Create a new Comments and pass the req.body to the entry
  var newComments = new Comments({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  // And save the new Comments the db
  newComments.save(function(error, Comments) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's Commentss
      Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "Commentss": Comments } })
      // Execute the above query
      .exec(function(err) {
        // Log any errors
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          // Or send the Comments to the browser
          res.send(Comments);
        }
      });
    }
  });
});

// Delete a Comments
app.delete("/Commentss/delete/:Comments_id/:article_id", function(req, res) {
  // Use the Comments id to find and delete it
  Comments.findOneAndRemove({ "_id": req.params.Comments_id }, function(err) {
    // Log any errors
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"Commentss": req.params.Comments_id}})
       // Execute the above query
        .exec(function(err) {
          // Log any errors
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            // Or send the Comments to the browser
            res.send("Comments Deleted");
          }
        });
    }
  });
});

// Listen on port
app.listen(PORT, function() {
  console.log("App running on PORT:" + PORT);
});

