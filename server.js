var express = require("express");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = (process.env.PORT || 3000);

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
//var MONGODB_URI = "mongodb://doybrian:doyis40!@ds145356.mlab.com:45356/heroku_9dffjs4c" || "mongodb://localhost/news";

var MONGODB_URI = "mongodb://user:myshit1@ds145356.mlab.com:45356/heroku_9dffjs4c";
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/news");

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
app.get("/", (req, res) => {
  // Grab every document in the Articles collection
  db.Article.find().sort({_id: -1})
    .populate("comments")
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


//route for getting a specific article, to use for displaying comments
app.get("/comment/:id", async (req, res) => {
  let id = req.params.id;

  try {
    const article = await db.Article.find({"_id": id}).populate("comments");
    console.log(article);
    res.json(article);

  } catch(e)
  {
    res.json(e);
  }
});


//route for posting new comments and associating each one to the article
app.post("/comment/:id", async (req, res) => {
  // Create a new comment and pass the req.body to the entry
  let id = req.params.id;
  console.log(id);

  try {
    const comment = await db.Comment.create(req.body);
    console.log(comment);
    try {
      const article = await db.Article.update({ "_id": id }, {$push: {"comments": comment._id }});
      res.json(article);
      console.log(article);
    } catch(e){
      res.json(e);
    }
  } catch(e) {
    res.json(e);
  }
  
});


// Route for deleting an Article's associated Comment
app.delete("/delete/:id1/:id2", (req, res) => {
  // Delete comment using id2
 db.Comment.deleteOne({"_id": req.params.id2 })
    .then(function(dbComment) {
      return db.Article.findOneAndUpdate({"_id": req.params.id1}, {$pull: {"comments": req.params.id2}});
    }).then(function(dbArticle){
      console.log("delete successful!");
    }).catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
  });



// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});