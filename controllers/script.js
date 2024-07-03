const User = require('../models/User');
const _ = require('lodash');  // Make sure to install lodash if you haven't already

/**
 * GET /
 * GET /feed
 * Render the script or feed page.
 */
exports.getScript = async (req, res) => {
    try {
        // Fetch or create the script data here
        const script = []; // Replace this with your actual script data fetching logic
        
        res.render('script', {
            title: 'Script',
            user: req.user,
            script: script // Add this line to pass the script data to the template
        });
    } catch (err) {
        console.error('Error in getScript:', err);
        res.status(500).send('An error occurred while loading the script');
    }
};

/**
 * POST /feed/
 * Record user's actions on ACTOR posts. 
 */
exports.postUpdateFeedAction = async (req, res) => {
    try {
        console.log('postUpdateFeedAction request:', req.body);
        const user = await User.findById(req.user.id).exec();
        let feedIndex = _.findIndex(user.feedAction, function (o) { return o.post == req.body.postID; });
        if (feedIndex == -1) {
            const cat = {
                post: req.body.postID,
                postClass: req.body.postClass,
            };
            feedIndex = user.feedAction.push(cat) - 1;
        }
        if (req.body.like) {
            const like = req.body.like;
            user.feedAction[feedIndex].likeTime.push(like);
            user.feedAction[feedIndex].liked = true;
            user.numPostLikes++;
        } else if (req.body.unlike) {
            const unlike = req.body.unlike;
            user.feedAction[feedIndex].unlikeTime.push(unlike);
            user.feedAction[feedIndex].liked = false;
            user.numPostLikes--;
        } else if (req.body.harmful) {
            const harmful = req.body.harmful;
            user.feedAction[feedIndex].harmfulTime.push(harmful);
            user.feedAction[feedIndex].harmful = true;
        }
        await user.save();
        res.send({ result: "success" });
    } catch (err) {
        console.error('Error in postUpdateFeedAction:', err);
        res.status(500).send({ result: "error", message: err.message });
    }
};

/**
 * POST /userPost_feed/
 * Record user's actions on USER posts, including reposting.
 */
exports.postUpdateUserPostFeedAction = async (req, res) => {
    try {
        console.log('postUpdateUserPostFeedAction request:', req.body);
        const user = await User.findById(req.user.id).exec();
        let feedIndex = _.findIndex(user.posts, function (o) { return o.postID == req.body.postID; });
        if (feedIndex == -1) {
            return res.status(404).send({ result: "error", message: "Post not found" });
        }
        if (req.body.like) {
            user.posts[feedIndex].liked = true;
        } else if (req.body.unlike) {
            user.posts[feedIndex].liked = false;
        } else if (req.body.harmful) {
            user.posts[feedIndex].harmful = true;
        }
        await user.save();
        res.send({ result: "success" });
    } catch (err) {
        console.error('Error in postUpdateUserPostFeedAction:', err);
        res.status(500).send({ result: "error", message: err.message });
    }
};

/**
 * POST /post/new
 * Create a new post.
 */
exports.newPost = async (req, res) => {
    try {
        // Implement new post creation logic here
        res.send({ result: "success", message: "New post created" });
    } catch (err) {
        console.error('Error in newPost:', err);
        res.status(500).send({ result: "error", message: err.message });
    }
};
