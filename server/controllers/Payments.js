const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");
const crypto = require("crypto");

exports.capturePayment = async (req, res) => {
    const { courses } = req.body;
    const userId = req.user.id;

    if (!courses || courses.length === 0) {
        return res.status(400).json({ success: false, message: "Please provide Course ID" });
    }

    let totalAmount = 0;
    const courseDetails = [];
    
    for (const courseId of courses) {
        try {
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ success: false, message: "Could not find the course" });
            }

            const uid = new mongoose.Types.ObjectId(userId);
            if (course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({ success: false, message: "Student is already Enrolled" });
            }

            totalAmount += course.price;
            courseDetails.push(course);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    try {
        const options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: Math.random(Date.now()).toString(),
            notes: {
                courseId: courses,
                userId: userId,
            }
        };

        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);

        return res.status(200).json({
            success: true,
            message: "Order created successfully",
            data: {
                orderId: paymentResponse.id,
                currency: paymentResponse.currency,
                amount: paymentResponse.amount,
                courses: courseDetails.map(course => ({
                    id: course._id,
                    name: course.courseName,
                    description: course.courseDescription,
                    thumbnail: course.thumbnail,
                    price: course.price
                }))
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Could not initiate payment" });
    }
};

exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courses } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses) {
        return res.status(400).json({ success: false, message: "Payment failed" });
    }

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Enroll student in the courses
            for (const courseId of courses) {
                try {
                    const enrolledCourse = await Course.findOneAndUpdate(
                        { _id: courseId },
                        { $push: { studentsEnrolled: userId } },
                        { new: true }
                    );

                    if (!enrolledCourse) {
                        return res.status(500).json({
                            success: false,
                            message: "Course not found"
                        });
                    }

                    const courseProgress = await CourseProgress.create({
                        courseID: courseId,
                        userId: userId,
                        completedVideos: [],
                    });

                    const enrolledStudent = await User.findByIdAndUpdate(
                        userId,
                        {
                            $push: {
                                courses: courseId,
                                courseProgress: courseProgress._id,
                            }
                        },
                        { new: true }
                    );

                    await mailSender(
                        enrolledStudent.email,
                        `Successfully Enrolled into ${enrolledCourse.courseName}`,
                        courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
                    );
                } catch (error) {
                    console.log(error);
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                }
            }

            return res.status(200).json({
                success: true,
                message: "Payment verified and course enrolled successfully"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body;
    const userId = req.user.id;

    if (!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({ success: false, message: "Please provide all the fields" });
    }

    try {
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Recieved`,
            paymentSuccessEmail(`${enrolledStudent.firstName}`, amount / 100, orderId, paymentId)
        );
        return res.json({ success: true });
    } catch (error) {
        console.log("error in sending mail", error);
        return res.status(500).json({ success: false, message: "Could not send email" });
    }
};
