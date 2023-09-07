import mongoose from "mongoose"
import URI from '../URI.js'

export const appListen = async (app) => {
    try {
        let connResult = await mongoose.connect(URI);
        app.listen(3000);
    }
    catch (err) {
        console.log(err)
    }
    
}