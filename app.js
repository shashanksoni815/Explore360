const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js")
const path = require("path");
const bodyParser = require('body-parser');
const methodOverride = require('method-override')
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js")
const ExpressError = require("./utils/ExpressError.js")
const {listingSchema} = require("./schema.js")
const Review = require("./models/review.js")

const MONGO_URL = "mongodb://127.0.0.1:27017/explore360";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
// app.use(express.static(path.join(__dirname, "/public")));
app.use('/public', express.static('public'));

app.get("/", (req, res) => {
    res.send("Server is started");
});

const validateListing = (req, res, next) => {
  let {error} = listingSchema.validate(req.body);
  // console.log(result);
  if(error) {
    let errMsg = error.details.map((el) => el.message).join("");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// Index Route
app.get("/listings", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("./listings/index.ejs", {allListings});
}))

// New Route
app.get("/listings/new", (req, res) => {
  res.render("./listings/new.ejs")
});

// Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
  let {id} = req.params;
  const listing = await Listing.findById(id);
  res.render("./listings/show.ejs", { listing });
}));

//Create Route
app.post("/listings", validateListing, wrapAsync(async (req, res, next) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings"); 
  // }catch(err) {
  //   next(err);
  // }

}));

// Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
  let {id} = req.params;
  const listing = await Listing.findById(id);
  res.render("./listings/edit.ejs", { listing });
}));

// Update Route
app.put("/listings/:id", validateListing, wrapAsync(async (req, res) => {
  let {id} = req.params;
  await Listing.findByIdAndUpdate(id, {...req.body.listing});
  res.redirect(`/listings/${id}`);
}));

// Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
  let {id} = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
}));

// Reviews Post route
app.post("/listings/:id/reviews", async(req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.reviewSchema);

  listing.review.push(newReview);

  await newReview.save();
  await listing.save();

  // console.log("New Reviw saved");
  // res.send("New Reviw saved");

  res.redirect(`/listings/${listing._id}`);
});


// app.get("/testListing", async (req, res) => {
//     let sampleListing = new Listing({
//         title: "My new Villa",
//         description : "By The Beach",
//         price: 1200,
//         location: "Calanguta, Goa",
//         country: "India",
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful")
// });

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not Found!"))
})

app.use((err, req, res, next) => {
  let {statusCode = 500, message = "Something Went wrong!"} = err;
  res.status(statusCode).render("./error.ejs", { message });
  //res.status(statusCode).send(message);
});

app.listen(8080, () => {
    console.log("server is listening to the port");
});