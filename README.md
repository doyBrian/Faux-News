# Faux-News
A news scraper app using MongoDB/Mongoose

### Overview

This is a web app that lets users view and leave comments on the latest news done through Mongoose and Cheerio which scrape news from another site.

### Design Plan

1. This project uses these npm packages:

   1. express

   2. express-handlebars

   3. mongoose

   4. cheerio

   5. axios


## Instructions

  1. Whenever a user visits the site, the app can scrape stories from a pre-selected news outlet by pressing the Scrape button and display these for the user by pressing Load Files which will update the page adding the current scraped news. 
  
  2. Each scraped article is saved to the database. At a minimum, the app scrapes and displays the following information for each article:

     * Headline - the title of the article

     * Summary - a short summary of the article

     * URL - the url to the original article

     * Image

  3. Users are also able to leave comments on the articles displayed and revisit them later. The comments will be saved to the database as well and associated with the articles. 
  
  4. Users will also be able to delete comments left on articles. All stored comments can be visible to every user.


### Notes

* Whenever you scrape a site for stories, the app won't save any duplicate entries.

* The app is designed so it won't clear out the database and override it with new scraped articles whenever a user accesses the site. New scraped articles will be added into the existing articles saved already in the database.

* The app is will always prepend or display the latest scraped news.
