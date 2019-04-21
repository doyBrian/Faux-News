var express = require("express");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 8080;

// Initialize Express
var app = express();

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//handlebar initialization
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
//var MONGODB_URI = "mongodb://<dbuser>:<dbpassword>@ds145356.mlab.com:45356/heroku_9dffjs4c" || "mongodb://localhost/news";
mongoose.connect("mongodb://<dbuser>:<dbpassword>@ds145356.mlab.com:45356/heroku_9dffjs4c", {useNewUrlParser: true});

//mongoose.connect("mongodb://localhost/news", { useNewUrlParser: true });


// Routes

// A GET route for scraping the fox news website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://www.foxnews.com/world").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);
  
      // Now, we grab every article, and do the following:
      $("section.has-load-more article.article").each(function(i, element) {
        // Save an empty result object
        var result = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        result.image = $(this)
          .find("img")
          .attr("src");
        result.time = $(this)
          .find("span.time")
          .text();
        result.summary = $(this)
          .find("p a")
          .text();
        let url = $(this).find("p a").attr("href");
        if (url.charAt(0) === '/') {
          result.link = "https://www.foxnews.com/" + url;
          result.title = $(this)
          .find("h4 a")
          .text();
        } else {
          result.link = url;
          result.title = "VIDEO: " + $(this)
          .find("h4 a")
          .text();
        }

        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function(dbArticle) {
              // View the added result in the console
              console.log(dbArticle);
            }) 
            .catch(function(err) {
              // If an error occurred, log it
              console.log(err);
            });
      });
    });
  });

// Route for getting all Articles from the db
app.get("/", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find().sort({_id: -1})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      //res.json(dbArticle);
      console.log(dbArticle);
      res.render("index", {articles: dbArticle});
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get("/comment/:id", function(req, res) {
  // Create a new comment and pass the req.body to the entry
  let id = req.params.id;
  console.log(id);
  db.Article.find({_id: id})
    .populate("comments")
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
      console.log(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.post("/comment/:id", function(req, res) {
  // Create a new comment and pass the req.body to the entry
  let id = req.params.id;
  console.log(id);
  db.Comment.create({name: req.body.name, body: req.body.body})
    .then(function(dbComment) {
      // If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Comment
      // { new: true } tells the query that we want it to return the updated Article -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.update({ _id: id }, { $push: {comments: dbComment._id } });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
      console.log(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Route for deleting an Article's associated Comment
app.delete("/delete/:id", function(req, res) {
  // Delete comment using id2
  db.Comment.findOneAndRemove({_id: req.params.id})
    .then(function(dbComment) {
      //then delete associated comment in Article
      console.log("delete successful");
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});