const Promise = require("bluebird");
const bcrypt = require("bcrypt-nodejs");

const schemas = require("./schemas.js");
const models = require("./models.js");
const db = require("./mongoose.js");

Promise.promisifyAll(bcrypt);

db.fetchUser = username => models.Users.findOne({ username: username });

db.saveUser = obj => {
  return db
    .fetchUser(obj.username)

    .then(user => {
      if (user === null) {
        const saltRounds = 10;
        return bcrypt
          .genSaltAsync(saltRounds)

          .then(salt => {
            return bcrypt
              .hashAsync(obj.password, salt, null)

              .then(hash => {
                obj.password = hash;
                return models.Users.create(
                  {
                    firstName: obj.firstName,
                    lastName: obj.lastName,
                    username: obj.username,
                    password: obj.password
                  },
                  err => {
                    console.log(err);
                  }
                );
              })

              .catch(err => console.log(err));
          });
      } else {
        return false;
      }
    });
};

db.savePicture = function(data) {
  const newPic = new models.Pictures({
    category: data.category,
    location: data.location,
    imageURL: data.imageURL,
    description: data.description,
    username: data.username,
    user_id: data.user_id,
    loc: {
      type: "Point",
      coordinates: [data.latLng.lng, data.latLng.lat]
    },
    tags: data.tags //store tags associated with picture
  });

  return newPic.save();
};

db.savePictureToUser = data => {
  models.Users.update(
    { _id: data.user_id },
    { $push: { photos: data } },
    (err, success) => {
      if (err) {
        console.log(err);
      } else {
        console.log(success);
      }
    }
  );
};

const MAX_DISTANCE = 20000000;

db.selectClosestPictures = location =>
  models.Pictures.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [Number(location.lng), Number(location.lat)] //[lat, lng]
        },
        distanceField: "distance",
        spherical: true,
        maxDistance: MAX_DISTANCE
      }
    },
    { $sort: { distance: 1 } },
    { $limit: 30 }
  ]);

db.addToFavorites = data =>
  models.Users.update({ _id: data.user_id }, { $push: { likes: data } });

module.exports = db;
