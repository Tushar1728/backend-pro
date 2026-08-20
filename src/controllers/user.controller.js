import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req, res)=>{
    
    /* 1. Get the User Information from frontend.
       2. Validate it.
       3. Check if user already exists: username , email.
       4. Check for Images, check for avatar
       5. Upload them to cloudinary, avatar
       6. Create user object - create entry in db
       7. Remove Password and refresh token field from response
       8. Check for user creation
       9. Return response
    */


    const {fullname, email, username, password} = req.body
    console.log("Register request:", { fullname, email, username, hasPassword: Boolean(password) });

    if(
        [fullname, email, username, password].some( (field)=>{
            return field?.trim() === ""
        } )
    ){
        throw new ApiError(400, "All fields are required.")
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email oe username already exists.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalpath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalpath);

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required.");
    }

    const user = await User.create({
        fullname, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while regitering the user.")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully.")
    )

})

export {registerUser};