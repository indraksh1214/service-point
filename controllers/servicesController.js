const Request = require('../model/service-request');

exports.checkIfNumberExists = (req,res,next)=>{
    /** check if number exist */
    let phone = req.body.number;
    Request.findOne({number:phone}).then((result)=>{
        if(result){
            console.log('Result : ',result)
            req.user_id = result._id;
        }
        else
            req.user_id = null;
        next();
    }).catch(err=>{
        next(err)
    })
}

exports.registerRequest = async(req,res)=>{
    try{
    const a = Math.floor(Math.random() * 100);
    const b = Math.floor(Math.random() * 100);
    const timestamp = new Date().getTime();
    var c = 'SR'+a+''+b;
    var service_request = {
        problem: req.body.problem,
        serviceNumber:c,
        status : 0,
        timestamp : timestamp
    }
    /** if user exist */
    if(req.user_id){
        Request.findByIdAndUpdate({
            _id : req.user_id
        },{
           $push : {service_request : service_request}
        }).then(response =>{
            console.log('response : ',response);
        })
    }
    else{
        const request = new Request({
            name: req.body.name,
            number: req.body.number,
            service_request: service_request
        });
        const servicRrequest = await request.save();
    }
    res.status(201).send({
        status:1,
        serviceNumber : c,
        message:'Thank you for registering '+ req.body.name +'. Your service request number is '+c+'. Use it for further interaction.'
    })
    } catch (err) {
        console.log(err);
        err.message = 'We are unable to process your request at this time. Please try again.'
        next(err);
   }
}

exports.checkServiceRequestStatus = async(req,res)=>{
    const refNumber =  req.params.refNumber.replaceAll(/^[ '"]+|[ '"]+$|( ){2,}/g,'$1');
    console.log('Refrence number ',refNumber)
    try{
        const requests = await Request.findOne(
            {$or: [ { number: refNumber },{ "service_request.serviceNumber":refNumber }]},
            {_id:0,name:1,number:1,"service_request.serviceNumber":1,"service_request.status":1}
        );
        if(requests){
            var message = `Hi ${requests.name},`;
            if(requests.number==refNumber){
                message += ` you have ${requests.service_request.length} ${requests.service_request.length>1?"requests":"request"}.` 
                var inner_message = "" 
                for(var i=0;i<requests.service_request.length;i++){
                    let element = requests.service_request[i];
                    console.log(element);
                    console.log("inner_message : ",inner_message);
                    if(inner_message!=""){
                        inner_message = `, request`
                    } 
                    else{
                        inner_message = `Request`
                    }
                    message += `${inner_message} ${element.serviceNumber} is ${element.status==0?'PENDING and expected ETA is 10 days':'COMPLETED'}`
                };
            }
            else{
                const matched_serviceRequest = await requests.service_request.find(({serviceNumber})=> serviceNumber==refNumber);
                console.log('matched_serviceRequest : ',matched_serviceRequest)
                message += ` your request ${matched_serviceRequest.serviceNumber} is ${matched_serviceRequest.status==0?'PENDING and expected ETA is 10 days':'COMPLETED'}`
            }
            
        }
        else{
            message = "Sorry, we couldn’t find any request registered. Would you like to register one? "
        }
        let output = {
            status : requests?1:0,
            message : message,
            name : requests?requests.name:"",
            number : requests?requests.number:""
        }
        res.status(200).json(output);
    }
    catch(err){
        console.log(err);
        res.status(500).json(err);
    }
}