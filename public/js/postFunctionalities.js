function likePost(e) {
    const target = $(e.target).closest('.ui.like.button');
    const label = target.closest('.ui.like.button').next("a.ui.basic.red.left.pointing.label.count");
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    const currDate = Date.now();

    if (target.hasClass("red")) { // Unlike Post
        target.removeClass("red");
        label.html(function(i, val) { return val * 1 - 1 });

        if (target.closest(".ui.fluid.card").attr("type") == 'userPost')
            $.post("/userPost_feed", {
                postID: postID,
                unlike: currDate,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        else
            $.post("/feed", {
                postID: postID,
                unlike: currDate,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
    } else { // Like Post
        target.addClass("red");
        label.html(function(i, val) { return val * 1 + 1 });

        if (target.closest(".ui.fluid.card").attr("type") == 'userPost')
            $.post("/userPost_feed", {
                postID: postID,
                like: currDate,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        else
            $.post("/feed", {
                postID: postID,
                like: currDate,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
    }
}

function likeComment(e) {
    const target = $(e.target);
    const comment = target.parents(".comment");
    const label = comment.find("span.num");

    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    const commentID = comment.attr("commentID");
    const isUserComment = comment.find("a.author").attr('href') === '/me';
    const currDate = Date.now();

    if (target.hasClass("red")) { // Unlike comment
        target.removeClass("red");
        comment.find("i.heart.icon").removeClass("red");
        target.html('Like');
        label.html(function(i, val) { return val * 1 - 1 });

        if (target.closest(".ui.fluid.card").attr("type") == 'userPost') {
            $.post("/userPost_feed", {
                postID: postID,
                commentID: commentID,
                unlike: currDate,
                isUserComment: isUserComment,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        } else {
            $.post("/feed", {
                postID: postID,
                commentID: commentID,
                unlike: currDate,
                isUserComment: isUserComment,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        }
    } else { // Like comment
        target.addClass("red");
        comment.find("i.heart.icon").addClass("red");
        target.html('Unlike');
        label.html(function(i, val) { return val * 1 + 1 });

        if (target.closest(".ui.fluid.card").attr("type") == 'userPost')
            $.post("/userPost_feed", {
                postID: postID,
                commentID: commentID,
                like: currDate,
                isUserComment: isUserComment,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        else
            $.post("/feed", {
                postID: postID,
                commentID: commentID,
                like: currDate,
                isUserComment: isUserComment,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
    }
}

function addComment(e) {
    const target = $(e.target);
    const text = target.siblings(".ui.form").find("textarea.newcomment").val().trim();
    const card = target.parents(".ui.fluid.card");
    let comments = card.find(".ui.comments");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    //no comments area - add it
    if (!comments.length) {
        const buttons = card.find(".ui.bottom.attached.icon.buttons")
        buttons.after('<div class="content"><div class="ui comments"></div>');
        comments = card.find(".ui.comments")
    }
    if (text.trim() !== '') {
        const currDate = Date.now();
        const ava = target.siblings('.ui.label').find('img.ui.avatar.image');
        const ava_img = ava.attr("src");

        // Add the comment to the post
        comments.append(
            `<div class="comment" commentID="${currDate}" new_comment="true">
                <a class="avatar">
                    <img src="${ava_img}">
                </a>
                <div class="content">
                    <a class="author" href="/me">You</a>
                    <div class="metadata">
                        <span class="date">${new Date(currDate).toLocaleString()}</span>
                    </div>
                    <div class="text">${text}</div>
                    <div class="actions">
                        <a class="like" onclick="likeComment(event)">Like</a>
                    </div>
                </div>
            </div>`
        );

        // Send the new comment to the server
        if (target.closest(".ui.fluid.card").attr("type") == 'userPost') {
            $.post("/userPost_feed", {
                postID: card.attr("postID"),
                new_comment: currDate,
                comment_text: text,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        } else {
            $.post("/feed", {
                postID: card.attr("postID"),
                new_comment: currDate,
                comment_text: text,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        }

        // Clear the comment textarea
        target.siblings(".ui.form").find("textarea.newcomment").val('');
    }
}

// Function to handle reposting a post
function repostPost(e) {
    const target = $(e.target).closest('.ui.repost.button');
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const currDate = Date.now();

    $.post("/userPost_feed", {
        postID: postID,
        repost: currDate,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    }, function(response) {
        if (response.result === "success") {
            // Handle successful reposting, e.g., show a message or update UI
            console.log('Post reposted successfully');
        } else {
            // Handle error case
            console.log('Error reposting the post');
        }
    });
}

// Function to handle harmful button
function markHarmful(e) {
    const target = $(e.target).closest('.ui.harmful.button');
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const currDate = Date.now();

    target.toggleClass("red");

    $.post("/userPost_feed", {
        postID: postID,
        harmful: target.hasClass("red") ? currDate : null,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    }, function(response) {
        if (response.result === "success") {
            // Handle successful marking, e.g., show a message or update UI
            console.log('Post marked as harmful successfully');
        } else {
            // Handle error case
            console.log('Error marking the post as harmful');
        }
    });
}

// Attach event listeners to the buttons
$(document).ready(function() {
    $('.ui.repost.button').on('click', repostPost);
    $('.ui.harmful.button').on('click', markHarmful);
});
