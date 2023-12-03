import { hash } from "bcrypt";
import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from 'jsonwebtoken';
import orderModel from "../models/orderModel.js";

export const registerController = async (req,res) => {
  try{
     const {name,email,password,phone,address,answer} = req.body;
     if(!name){
        return res.status(401).json({message:"Name is required"});
     }
      if (!email){
        return res.status(402).json({message: 'Email is required'})
     } 
      if (!password){
        return res.status(403).json({message:'Password is required'})
      } 
       if (!phone){
        return res.status(404).json({message:'Phone number is required'})
       }  if (!address){
        return res.status(405).json({message:'Address is required'})
    }
    if (!answer){
      return res.status(405).json({message:'Answer is required'})
  }
    const existingUser = await userModel.findOne({email:email});
    //existing user
    if(existingUser) {
        return res.status(406).json({
            success:true,
            message:'Already registered please login'
        })
    }

    //register user

    const hashedPassword = await  hashPassword(password);

    //save

    const user = new userModel({name,email,phone,address,password:hashedPassword,answer});
    const savedUser = await user.save();
    res.status(201).send({
        success:true,
        message:'user registered',
        savedUser
    })


    

  }catch(error) {
    console.log('Error:', error);
    res.status(500).json({message:'Server Error'});
  }
}



export const loginController = async (req,res) => {
try{
  const {email, password} = req.body
  if(!email || !password){
    return res.status(404).json({
      success:false,
      message:"Invalid email or password",
    })
  }
  //check user
  const user = await userModel.findOne({email:email})
  if(!user){
    return res.status(404).json({
      success:false,
      message:"Email is not registered",
    })
  }
const match = await comparePassword(password, user.password)

if(!match){
  return res.status(200).json({
    success:false,
    message:"Password did not match",
  })
}

//token

const token = await JWT.sign({_id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
res.status(200).json({
  success:true,
  message:"Logged in successfully",
  user:{
    name:user.name,
    email:user.email,
    phone:user.phone,
    address:user.address,
    role:user.role
  },
  token,
})
}catch(error){
console.log(error);
res.status(500).json({
  success:false,
  message:"server error",
  error
});
}
}

export const forgotPasswordController = async(req,res) => {
try{
const {email,answer, newPassword} = req.body;
if (!email){
  return res.status(402).json({message: 'Email is required'})
}
  if (!answer){
    return res.status(402).json({message: 'answer is required'})
 }
 if (!newPassword){
  return res.status(402).json({message: 'newPassword is required'})
}

const user = await userModel.findOne({email,answer})
if(!user){
  return res.status(404).json({
    success:false,
    message:"wrong email or answer",
  })
}

const hashed = await hashPassword(newPassword)
await userModel.findByIdAndUpdate(user._id,{password:hashed})
res.status(200).json({
  success:true,
  message:"Password reset successfully",
});

} catch(error) {
  console.log(error);
  res.status(500).json({
    success:false,
    message:"server error",
    error
  });
}
}


export const testController = (req,res) => {
  res.send('protected route');
}


//update prfole
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);
    //password
    if (password && password.length < 6) {
      return res.json({ error: "Passsword is required and 6 character long" });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error While Update profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};


export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 })
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};


//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updateing Order",
      error,
    });
  }
};




