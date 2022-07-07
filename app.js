const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(3000);
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  // const dateToday = new Date();
  // var options = { weekday: "long", day: "numeric", month: "long" };
  // var day = dateToday.toLocaleDateString("en-US", options);
  Item.find({}, (err, ans) => {
    if (ans.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Items inserted successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", listItem: ans });
    }
  });
});

//Dynamic routing
app.get("/:customListName", (req, res) => {
  const listName = _.capitalize(req.params.customListName);
  List.findOne({ name: listName }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      if (!doc) {
        const list = new List({
          name: listName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        res.render("list", { listTitle: doc.name, listItem: doc.items });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.listItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName !== "Today") {
    List.findOne({ name: listName }, (err, doc) => {
      doc.items.push(item);
      doc.save();
      res.redirect("/" + listName);
    });
  } else {
    item.save();
    res.redirect("/");
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.done;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, doc) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", listItem: workItems });
});

app.post("/work", function (req, res) {
  let item = req.body.listItem;
  workItems.push(item);
  res.redirect("/work");
});
