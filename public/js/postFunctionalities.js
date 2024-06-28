function likePost(e) {
    const target = $(e.target).closest('.ui.like.button');
    const label = target.closest('.ui.like.button').next("a.ui.basic.red.left.pointing.label.count");
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    const currDate = Date.now();

    if (target.hasClass("red")) { //Unlike Post
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
    } else { //Like Post
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

    if (target.hasClass("red")) { //Unlike comment
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
    } else { //Like comment
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
       
