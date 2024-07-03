/**
 * POST /feed/
 * Record user's actions on ACTOR posts. 
 */
exports.postUpdateFeedAction = async (req, res, next) => {
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
        res.send({ result: "error", message: err.message });
    }
};

/**
 * POST /userPost_feed/
 * Record user's actions on USER posts, including reposting.
 */
exports.postUpdateUserPostFeedAction = async (req, res, next) => {
    try {
        console.log('postUpdateUserPostFeedAction request:', req.body);
        const user = await User.findById(req.user.id).exec();
        let feedIndex = _.findIndex(user.posts, function (o) { return o.postID == req.body.postID; });

        if (feedIndex == -1) {
            res.send({ result: "error", message: "Post not found" });
            return;
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
        res.send({ result: "error", message: err.message });
    }
};
