import mongoose from "mongoose"

export const appListen = async (app, URI) => {
    try {
        await mongoose.connect(URI);
        app.listen(process.env.PORT || 3000);
    }
    catch (err) {
        console.log(err)
    }
    
}