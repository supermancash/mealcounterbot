import mongoose from "mongoose";


const mongoConnection = () => {
    mongoose.connect("mongodb+srv://supermancash:k5WulGz8A3tARjfT@cluster0.rm2ep.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
        {useNewUrlParser: true, useUnifiedTopology: true},
        err => {if(err!=null)console.log(err)}
    );
// pw: k5WulGz8A3tARjfT
}

export default mongoConnection;