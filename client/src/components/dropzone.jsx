import React from "react";
import ReactDOM from "react-dom";
import Dropzone from "react-dropzone";
import axios from "axios";
import { BounceLoader } from "react-spinners";

import EXIF from "exif-js";
import Promise from "bluebird";
import $ from "jquery";

/*
This component helps to upload images by providing a 
'dropzone' area that you can click on or drop items into.
Specifically, it's used inside the upload.jsx file.
It uses formData to handle file uploading to the form.
Additionally, it's possible to upload an array of images, 
but in this case we only append the 0th element of the array (the first item).
*/

export default class Accept extends React.Component {
  constructor() {
    super();
    this.state = {
      accepted: [],
      rejected: [],
      uploaded: false,
      loading: false
    };
    this.changeImg = this.changeImg.bind(this);
  }

  onDrop(img) {
    const formData = new FormData();
    let dataArr = [];
    const that = this;

    let toDecimal = function(meta) {
      return (
        meta[0].numerator +
        meta[1].numerator / (60 * meta[1].denominator) +
        meta[2].numerator / (3600 * meta[2].denominator)
      );
    };

    for (let i = 0; i < img.length; i++) {
      dataArr[i] = new FormData();
      dataArr[i].append("image", img[i]);
      //Uses EXIF to parse GPS coordinates from .jpeg images
      EXIF.getData(img[i], function() {
        let metaTags = EXIF.getAllTags(this);

        let lat, lng;

        lat =
          metaTags.GPSLatitudeRef === "N"
            ? toDecimal(metaTags.GPSLatitude)
            : toDecimal(metaTags.GPSLatitude) * -1;
        lng =
          metaTags.GPSLongitudeRef === "E"
            ? toDecimal(metaTags.GPSLongitude)
            : toDecimal(metaTags.GPSLongitude) * -1;
        let latLng = { lat: lat, lng: lng };
        that.props.setLocation(latLng);
      });
    }

    this.setState({
      loading: true,
      uploaded: false
    });

    // dataArr.forEach((form) => {
    //   axios({
    //     method: 'post',
    //     url: 'https://api.imgur.com/3/image',
    //     headers: {Authorization: "Client-ID 3f9b22888755abe"},
    //     data: form
    //   })
    //   .then(function(response) {
    //     console.log(response);
    //     that.props.getLink(response.data.data.link);
    //   })
    //   .catch(function(err) {
    //     console.log(err);
    //   })
    // })

    Promise.map(dataArr, form => {
      return axios({
        method: "post",
        url: "https://api.imgur.com/3/image",
        headers: { Authorization: "Client-ID b13c02768a20879" },
        data: form
      })
        .then(response => {
          console.log(response);
          that.props.getLink(response.data.data.link);
        })
        .catch(err => {
          console.log("this is your err message");
        });
    }).then(() => {
      that.setState({
        loading: false,
        uploaded: true
      });
    });
  }

  changeImg() {
    if (this.state.loading) {
      return (
        <BounceLoader
          color={"#87ceff"}
          loading={this.state.loading}
          size={100}
        />
      );
    } else if (this.state.uploaded) {
      return (
        <img
          width="100px"
          height="100px"
          src="http://pluspng.com/img-png/success-png-success-icon-image-23194-400.png"
        />
      );
    } else {
      return (
        <img
          width="100px"
          height="100px"
          src="https://png.icons8.com/metro/100/000000/upload.png"
        />
      );
    }
    console.log("accepted array", this.state.uploaded);
  }

  render() {
    return (
      <section>
        <div className="dropzone">
          <Dropzone
            accept="image/jpeg, image/png"
            onDrop={this.onDrop.bind(this)}
            style={{
              width: `100%`,
              border: `2px dashed grey`,
              height: `400px`
            }}
          >
            <div
              style={{
                width: `80%`,
                margin: `auto`,
                paddingTop: `50px`,
                paddingBottom: `50px`,
                textAlign: `center`
              }}
            >
              <p>
                Try dropping a file here, or click to select files to upload.
              </p>
              <p>Only *.jpeg and *.png images will be accepted</p>
            </div>
            <div style={{ width: `100px`, margin: `auto` }}>
              {this.changeImg()}
            </div>
          </Dropzone>
        </div>
        <aside>
          {/* <h4>Accepted files</h4> */}
          <ul>
            {this.state.accepted.map(f => (
              <li key={f.name}>
                {f.name} - {f.size} bytes
              </li>
            ))}
          </ul>
          {/* <h4>Rejected files</h4> */}
          <ul>
            {this.state.rejected.map(f => (
              <li key={f.name}>
                {f.name} - {f.size} bytes
              </li>
            ))}
          </ul>
        </aside>
      </section>
    );
  }
}
