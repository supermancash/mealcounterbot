import mongoose from "mongoose";


const mongoConnection = () => {
    mongoose.connect(process.env.MONGO_URI,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: true
        },
        err => {if(err!=null)console.log(err)}
    );
}

export default mongoConnection;