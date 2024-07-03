exports.postUpdateFeedAction = async(req, res, next) => {
    try {
        const user = await User.findById(req.user.id).exec();
        let feedIndex = _.findIndex(user.feedAction, function(o) { return o.post == req.body.postID; });

        if (feedIndex == -1) {
            const cat = {
                post: req.body.postID,
                postClass: req.body.postClass,
            };
            feedIndex = user.feedAction.push(cat) - 1;
        }

        if (req.body.new_comment) {
            user.numComments = user.numComments + 1;
            const cat = {
                new_comment: true,
                new_comment_id: user.numComments,
                body: req.body.comment_text,
                relativeTime: req.body.new_comment - user.createdAt,
                absTime: req.body.new_comment,
                liked: false,
                harmful: false,
            }
            user.feedAction[feedIndex].comments.push(cat);
        }
        else if (req.body.commentID) {
            const isUserComment = (req.body.isUserComment == 'true');
            let commentIndex = (isUserComment) ?
                _.findIndex(user.feedAction[feedIndex].comments, function(o) {
                    return o.new_comment_id == req.body.commentID && o.new_comment == isUserComment
                }) :
                _.findIndex(user.feedAction[feedIndex].comments, function(o) {
                    return o.comment == req.body.commentID && o.new_comment == isUserComment
                });

            if (commentIndex == -1) {
                const cat = {
                    comment: req.body.commentID
                };
                user.feedAction[feedIndex].comments.push(cat);
                commentIndex = user.feedAction[feedIndex].comments.length - 1;
            }

            if (req.body.like) {
                const like = req.body.like;
                user.feedAction[feedIndex].comments[commentIndex].likeTime.push(like);
                user.feedAction[feedIndex].comments[commentIndex].liked = true;
                if (req.body.isUserComment != 'true') user.numCommentLikes++;
            }

            if (req.body.unlike) {
                const unlike = req.body.unlike;
                user.feedAction[feedIndex].comments[commentIndex].unlikeTime.push(unlike);
                user.feedAction[feedIndex].comments[commentIndex].liked = false;
                if (req.body.isUserComment != 'true') user.numCommentLikes--;
            }

            else if (req.body.harmful) {
                const harmful = req.body.harmful;
                user.feedAction[feedIndex].comments[commentIndex].harmfulTime.push(harmful);
                user.feedAction[feedIndex].comments[commentIndex].harmful = true;
            }
        }
        else {
            if (req.body.harmful) {
                const harmful = req.body.harmful;
                user.feedAction[feedIndex].harmfulTime = [harmful];
                user.feedAction[feedIndex].harmful = true;
            }

            else if (req.body.like) {
                const like = req.body.like;
                user.feedAction[feedIndex].likeTime.push(like);
                user.feedAction[feedIndex].liked = true;
                user.numPostLikes++;
            }
            else if (req.body.unlike) {
                const unlike = req.body.unlike;
                user.feedAction[feedIndex].unlikeTime.push(unlike);
                user.feedAction[feedIndex].liked = false;
                user.numPostLikes--;
            }
            else if (req.body.viewed) {
                const view = req.body.viewed;
                user.feedAction[feedIndex].readTime.push(view);
                user.feedAction[feedIndex].rereadTimes++;
                user.feedAction[feedIndex].mostRecentTime = Date.now();
            } else {
                console.log('Something in feedAction went crazy. You should never see this.');
            }
        }
        await user.save();
        res.send({ result: "success", numComments: user.numComments });
    } catch (err) {
        next(err);
    }
};

exports.postUpdateUserPostFeedAction = async(req, res, next) => {
    try {
        const user = await User.findById(req.user.id).exec();
        let feedIndex = _.findIndex(user.posts, function(o) { return o.postID == req.body.postID; });

        if (feedIndex == -1) {
            // Should not happen.
        }
        else if (req.body.new_comment) {
            user.numComments = user.numComments + 1;
            const cat = {
                body: req.body.comment_text,
                commentID: user.numComments,
                relativeTime: req.body.new_comment - user.createdAt,
                absTime: req.body.new_comment,
                new_comment: true,
                liked: false,
                harmful: false,
                likes: 0
            };
            user.posts[feedIndex].comments.push(cat);
        }
        else if (req.body.commentID) {
            const commentIndex = _.findIndex(user.posts[feedIndex].comments, function(o) {
                return o.commentID == req.body.commentID && o.new_comment == (req.body.isUserComment == 'true');
            });
            if (commentIndex == -1) {
                console.log("Should not happen.");
            }
            else if (req.body.like) {
                user.posts[feedIndex].comments[commentIndex].liked = true;
            }
            else if (req.body.unlike) {
                user.posts[feedIndex].comments[commentIndex].liked = false;
            }
            else if (req.body.harmful) {
                user.posts[feedIndex].comments[commentIndex].harmful = true;
            }
        }
        else {
            if (req.body.like) {
                user.posts[feedIndex].liked = true;
            }
            if (req.body.unlike) {
                user.posts[feedIndex].liked = false;
            }
            if (req.body.harmful) {
                user.posts[feedIndex].harmful = true;
            }
        }
        await user.save();
        res.send({ result: "success", numComments: user.numComments });
    } catch (err) {
        next(err);
    }
};
