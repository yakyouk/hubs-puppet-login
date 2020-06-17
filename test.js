require("dotenv").config()
console.log(process.env.RETICULUM_SERVER)
require("./utils/verify-auth")(
  "https://mccvr.net/?auth_origin=hubs&auth_payload=ZhKPpS9AO0kuVMOKFea%2FkXDvQ4YxwLIT6eGq8PRGCecS8NFRZDWdzT59SUDbOz7ERx9sPFexftHIxmQHonCIGUhE%2Byj5PSqRm%2BqueQ%3D%3D&auth_token=53caa218d57a962fd55d36039e0903d1&auth_topic=auth%3Aa8a9f536-cbbb-4496-8d43-d94b2c760c34"
);
