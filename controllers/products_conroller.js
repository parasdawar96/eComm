const mongoose = require('mongoose');

const Product = require('../models/product');
const KeyWord = require('../models/keyWord');

var async = require("async");
// { contribs: { $in: [ "ALGOL", "Lisp" ]} }

// { "makes.fgh" : { $exists : true } }
function setSizeandColorQuery(valueArray,queryObject){
        valueArray.forEach(element=>{
            var obj={};
            obj.$exists=true;
            queryObject["size."+element]=obj;
        });
        return queryObject;
}

async function setQueryObject(query) {
    let queryObject = {};
    let sortObj = {};
    let searchType="";
    if (query.filter) {
        var filterArray = query.filter.split("::");
        filterArray.forEach(element => {
            let keyValueArray = element.split(":");
            var valueArray = keyValueArray[1].split(",");
            if (valueArray.length > 1) {
                if(keyValueArray[0]=="size"){
                    queryObject=setSizeandColorQuery(valueArray,queryObject);
                }
                else{
                    let obj = {};
                    obj["$in"] = valueArray;
                    queryObject[keyValueArray[0]] = obj;
                }
            }
            else {
                if(keyValueArray[0]=="size"){
                    queryObject=setSizeandColorQuery(valueArray,queryObject);
                }
                else{
                    queryObject[keyValueArray[0]] = valueArray[0];
                }
               
            }

        })
    }
    if (query.gender) queryObject["gender"] = query.gender;
    if (query.sort) {
        let keyValArray = query.sort.split("_");
      //  console.log("keyValArray",keyValArray);
        if (keyValArray[1] == "desc") {
            sortObj[keyValArray[0]] = -1;
        }
        else {
            sortObj[keyValArray[0]] = 1;
        }
    }
    if(query.search){
        //query.search= toCapitalize(query.search);
        let search=query.search.toLowerCase();
        let promise= new Promise((res,rej)=>{
            res( KeyWord.find({name:search}));
        })
        let result= await promise;
        console.log("promise result",result);
        if(result.length){
            let type=result[0].type;
            searchType=type;
            if(queryObject[type]){
                let obj=queryObject[type];
                console.log("obj",obj)
                if(!obj["$in"].includes(query.search)){
                    queryObject.type["$in"].push(query.search);
                }
            }
            else{
                let obj={};
                obj["$in"]=[];
                obj["$in"].push(query.search);
                queryObject[type]=obj;
            }
        }
        
        
        // KeyWord.find({name:search},(err,dataObj)=>{
        //     if(err)console.log("keyword not present")
        //     else{
        //         let type=dataObj[0].type;
        //         console.log("type",dataObj);
        //         if(queryObject[type]){
        //             let obj=queryObject[type];
        //             if(!obj["$in"].includes(query.search)){
        //                 queryObject.type["$in"].push(query.search);
        //             }
        //         }
        //         else{
        //             let obj={};
        //             obj["$in"]=[];
        //             obj["$in"].push(query.search);
        //             queryObject[type]=obj;
        //         }
        //     }
        // })
        
    }
   // console.log("queryObj",queryObject);
   // console.log("sortObj",sortObj);
    return {
        queryObject,
        sortObj,
        searchType
    };
}

function toCapitalize(search){
    return search[0].toUpperCase() + search.slice(1);
}



async function fetchFilters(queryObj,filterCategory) {
    // filterCategory[0]=(queryObj.department)?"category":"department";
    var o = {};
    let promiseArray = [];
    filterCategory.forEach(async element => {
        let tempQueryObj = Object.keys(queryObj).reduce((object, key) => {
            if (key != element && key.indexOf("size")<0) {
                object[key] = queryObj[key];
            }
            return object;
        }, {});
        console.log("element",element);
        console.log("tempQueryObj",tempQueryObj);
        if (element == "size") {
            o.query = tempQueryObj;
            o.map = function () {
                for (let sizeKey in this.size) {
                    emit(sizeKey, 1);
                }
            };
            o.reduce = function (key, value) {
                return Array.sum(value);
            };

            o.out = { inline: 1 };
            o.verbose = false;
            let sizeFilterPromise = new Promise((res, rej) => {
                res(Product.mapReduce(o));
            });
            promiseArray.push(sizeFilterPromise);
        }
        else {
            let promise = new Promise((res, rej) => {
                res(Product.aggregate([
                    { '$match': tempQueryObj },
                    { "$group": { _id: `$${element}`, value: { $sum: 1 } } }
                ]));
            })
            promiseArray.push(promise);
        }
    });
    return Promise.allSettled(promiseArray);

}

function setBreadCrumbList(queryObj) {
    let breadCrumbList = [];
    let breadCrumbType = ["gender", "mainCategory", "category"];
    breadCrumbType.forEach(element => {
        if (queryObj[element]) {
            let breadCrumbObj = {};
            breadCrumbObj.url = "?" + element + "=" + queryObj[element];
            breadCrumbObj.text = queryObj[element];
            breadCrumbList.push(breadCrumbObj);
        }
    });
    return breadCrumbList;

}
// "filterObj": {
    //     "department": [
    //         {
    //             "_id": null,
    //             "count": 2
    //         }
    //     ],
    //     "brand": [
    //         {
    //             "_id": "Adidas",
    //             "count": 1
    //         },
    //         {
    //             "_id": "Puma",
    //             "count": 1
    //         }

function modifyFilterObj(filterObj){
    for(let filterItem in filterObj){
        filterObj[filterItem]=filterObj[filterItem].map(element=>{
            let obj={};
            obj[element._id]=element.value;
            return obj;
        });
    }
    
    return filterObj;
}


module.exports = {

    async readAllProducts(req, res) {
        let { queryObject, sortObj,searchType } = await setQueryObject(req.query);
        let limit = (req.query.limit) ? req.query.limit : 0;
        limit=+limit;
        let filterCategory = ["category","brand" , "color", "size"];
        if(filterCategory.includes(searchType)){
            let index=filterCategory.indexOf(searchType);
           filterCategory.splice(index,1);
        }
        console.log("updated filter category",filterCategory);
        
        let filterObj = {};
        try{
            console.log("updated query object",queryObject);
            let filterResults = await fetchFilters(queryObject,filterCategory);
            filterResults.forEach((result, num) => {
                if (result.status == "fulfilled") {
                    filterObj[filterCategory[num]] = result.value;
                }
                else {
                    console.log("promise allsettled error", result.reason);
                }
            });
            //filterObj=modifyFilterObj(filterObj);
            let resultantObject = {};
            resultantObject.filterObj = filterObj;
            resultantObject.breadCrumbList = setBreadCrumbList(req.query);
            Product.find(queryObject).sort(sortObj).exec((err, products) => {
                if (err) console.log("error in fetching all products");
                resultantObject.productCount = products.length;
                resultantObject.products = products;
                res.type('json');
                res.status(200).send(resultantObject);
            });
        }
        catch(err){ObjectId("5eb12998df51bac2c4ac8dd6"), 
            console.log("await error",err);
        }

    },

    readProduct(req, res) {
        let id = req.params.id;
      //  console.log("id:",id);
        Product.findById(id).exec((err, product) => {
            if (err) console.log("error in fetching single product");

            res.status(200).send(product);
        });
    },








};