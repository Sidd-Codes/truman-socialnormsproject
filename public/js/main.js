//Before Page load:
$('#content').hide();
$('#loading').show();
let isActive = false;
let activeStartTime;

function resetActiveTimer(loggingOut) {
    if (isActive) {
        const currentTime = new Date();
        const activeDuration = currentTime - activeStartTime;
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup' && window.location.pathname !== '/forgot') {
            $.post("/pageTimes", {
                time: activeDuration,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            }).then(function() {
                if (loggingOut) {
                    window.loggingOut = true;
                    window.location.href = '/logout';
                }
            })
        }
        isActive = false;
    }
}

$(window).on("load", function() {
    console.log("Window loaded in main.js");

    /**
     * Recording user's active time on website:
     */
    // ... (keep the existing code for user activity tracking)

    /**
     * Other site functionalities:
     */
    // Close loading dimmer on content load.
    $('#loading').hide();
    $('#content').fadeIn('slow');

    // Fomantic UI: Enable closing messages
    $('.message .close').on('click', function() {
        $(this).closest('.message').transition('fade');
    });
    // Fomantic UI: Enable checkboxes
    $('.checkbox').checkbox();

    // Check if user has any notifications every 5 seconds.
    if (window.location.pathname !== '/login' && window.location.pathname !== '/signup' && window.location.pathname !== '/forgot') {
        $.post("/pageLog", {
            path: window.location.pathname,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
        if (window.location.pathname !== '/notifications') {
            setInterval(function() {
                // method to be executed;
                $.getJSON("/notifications", { bell: true }, function(json) {
                    if (json.count != 0) {
                        $("i.big.alarm.icon").replaceWith('<i class="big icons"><i class="red alarm icon"></i><i class="corner yellow lightning icon"></i></i>');
                    }
                });
            }, 5000);
        }
    };

    // Picture Preview on Image Selection (Used for: uploading new post, updating profile)
    function readURL(input) {
        if (input.files && input.files[0]) {
            let reader = new FileReader();
            reader.onload = function(e) {
                $('#imgInp').attr('src', e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    $("#picinput").change(function() {
        readURL(this);
    });

    // Lazy loading of images on site
    $(`#content .fluid.card .img img, #content img.ui.avatar.image, #content a.avatar img`).visibility({
        type: 'image'
    });

    // Initialize post functionalities if the function exists
    if (typeof initializePostFunctionalities === 'function') {
        console.log("Calling initializePostFunctionalities from main.js");
        initializePostFunctionalities();
    } else {
        console.error("initializePostFunctionalities function not found");
    }
});

    // Picture Preview on Image Selection (Used for: uploading new post, updating profile)
    function readURL(input) {
        if (input.files && input.files[0]) {
            let reader = new FileReader();
            reader.onload = function(e) {
                $('#imgInp').attr('src', e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    $("#picinput").change(function() {
        readURL(this);
    });

    // Lazy loading of images on site
    $(`#content .fluid.card .img img, #content img.ui.avatar.image, #content a.avatar img`).visibility({
        type: 'image'
    });
});

$(window).on("beforeunload", function() {
    // https: //developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
    if (!window.loggingOut) {
        resetActiveTimer(false);
    }
});
