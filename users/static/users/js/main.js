// SETUP - inject csrf token in request headers before sending
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            let csrftoken = Cookies.get("csrftoken");
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}


// SORTING TYPES - used to sort the user feed
// Each sort type enum holds a pair of id and name values
const SORT_TYPES = {
    DEFAULT: ["id_default", "Default (hobbies)"],
    AGE_ASCENDING: ["id_age_ascending", "Age (ascending)"],
    AGE_DESCENDING: ["id_age_descending", "Age (descending)"],
    MALE: ["id_gender_male", "Gender (Male)"],
    FEMALE: ["id_gender_female", "Gender (Female)"],
};

Object.freeze(SORT_TYPES);

// SIGNUP FORM - show list of hobbies on modal show via ajax get
$("#modal-signup").on("show.bs.modal", function () {
    $.get({
        url: "hobbies/",
        datatype: 'json',
        success: function (json) {
            $.each(json, function (i, value) {
                $('#id_hobbies').append($('<option>').text(value).attr('value', value));
            });

        }
    })
});

// SIGNUP FORM - submit form via ajax post
$(document).on("submit", ".signup-form", function (event) {
    event.preventDefault();
    $("#modal-signup").modal("toggle");

    $.post({
        url: "create/",
        data: {
            username: $("#id_username-signup").val(),
            email: $("#id_email").val(),
            password: $("#id_password-signup").val(),
            firstName: $("#id_first-name").val(),
            lastName: $("#id_last-name").val(),
            gender: $("#id_gender").val(),
            birthday: $("#id_birthday").val(),
            hobbies: $("#id_hobbies").val(),
            image: $("#id_profile_image").val()
        },
        success: function () {
            $("#modal-login").modal("toggle");
        }

    })
});

// LOGIN FORM - submit form via ajax post
$(document).on("submit", ".login-form", function (event) {
    event.preventDefault();
    $("#modal-login").modal("toggle");

    $.post({
        url: "login/",
        data: {
            username: $("#id_username").val(),
            password: $("#id_password").val(),
        },
        success: function () {
            renderUserProfile()
        },
    })
});

// POKE BUTTON - listens for click of poke link and calls backend via ajax get, once poked render the user profile
$(document).on('click', '#id_poke', function (event) {
    event.preventDefault();
    let userId = $(this).data("user-id");
    $.post({
        url: 'poke/',
        data: {
            username: userId,
        },
        success: function () {
            renderUserProfile()
        }
    })
});

// GET PROFILE - ajax call to initially get profile of logged in user via ajax get
$(function () {
    renderUserProfile()
});


// SORT USER FEED - listens for click of radio button to sort user feed and passes the sort type obtained from the radio button
$(document).on("change", "input[type='radio']", function () {
    let sortType = getSortTypeKey($(this).attr("id"));
    renderUserProfile(sortType)
});

// RENDER USER PROFILE - renders the user profile triggered after login, renders with a default sort by hobbies
function renderUserProfile(sortType = getSortTypeKey(SORT_TYPES.DEFAULT[0])) {
    $.get({
        url: "user-profile/",
        success: function (profile) {
            $(".profile").html(
                "<p></p> <div class='row'>" +
                buildUserProfileCard(profile) +
                buildUserFeedCards(profile, sortType) +
                buildFilerAndPokesCards(profile, sortType) +
                "</div>")
        },
        error: function () {
            $(".profile").html(buildNotLoggedInCards())
        }
    })
}

// BUILD USER INFO CARD - builds a user info card from profile json
function buildUserProfileCard(profile) {
    let thisUsersHobbyListItems = "";

    $.each(profile.user.hobbies, function (i, hobby) {
        thisUsersHobbyListItems += "<li class='list-group-item'>" + hobby + "</li>"
    });

    return "<div class='col-md-3'>" +
        "   <div class='card'>" +
        "       <div class='card-body'>" +
        "           <div class='mr-2'>" +
        "               <img class='rounded-circle' width='45' src='https://picsum.photos/50/50' alt=''>" +
        "           </div>" +
        "           <div class='h5'>@" + profile.user.username + "</div>" +
        "           <div class='h7 text-muted'>" + profile.user.firstName + " " + profile.user.lastName + "</div>" +
        "           <div class='h7 text-muted'>" + profile.user.age + " years</div>" +
        "           <div class='h7 text-muted'>" + profile.user.birthday + "</div>" +
        "           <div class='h7 text-muted'>" + profile.user.gender + "</div>" +
        "       </div>" +
        "       <ul class='list-group list-group-flush'>" +
        "           <li class='list-group-item'>" +
        "               <div class='h5'>Your Hobbies</div>" +
        "               <ul class='list-group list-group-flush'>" + thisUsersHobbyListItems + "</ul>" +
        "           </li>" +
        "       </ul>" +
        "   </div>" +
        "   <br>" +
        "   <div class='card gedf-card'>" +
        "       <div class='card-body'>" +
        "           <a href='logout/' class='card-link'>Logout</a>" +
        "           <a href='#' class='card-link'>Another link?</a>" +
        "           </div>" +
        "   </div>" +
        "</div>";
}


// BUILD USER FEED CARDS - builds a user feed cards from profile json and sort type
function buildUserFeedCards(profile, sortType) {
    let userFeedCards = "<div class='col-md-6 gedf-main'>";

    if (profile.suggestedUsers.length > 0) {
        $.each(sortedSuggestedUsers(profile, sortType), function (i, suggestedUser) {
            let mutualHobbies = getMutualHobbies(profile, suggestedUser);
            let title = "You and " + suggestedUser.username + " both share " + mutualHobbies.length;
            if (mutualHobbies.length > 1) {
                title += " hobbies"
            } else {
                title += " hobby"
            }

            userFeedCards +=
                "<div class='card gedf-card'>" +
                "   <div class='card-header'>" +
                "       <div class='d-flex justify-content-between align-items-center'>" +
                "           <div class='d-flex justify-content-between align-items-center'>" +
                "               <div class='mr-2'>" +
                "                   <img class='rounded-circle' width='45' src='https://picsum.photos/50/50' alt=''>" +
                "               </div>" +
                "               <div class='ml-2'>" +
                "                   <div class='h5 m-0'>@" + suggestedUser.username + "</div>" +
                "                   <div class='h7 text-muted'>" + suggestedUser.firstName + " " + suggestedUser.lastName + "</div>" +
                "               </div>" +
                "           </div>" +
                "       </div>" +
                "   </div>" +
                "   <div class='card-body'>" +
                "       <div class='text-muted h7 mb-2'><i class='fa fa-clock-o'></i>" + suggestedUser.gender + ", " + suggestedUser.age + " years" + "</div>" +
                "       <a class='card-link' href='#'>" +
                "           <h5 class='card-title'>" + title + "</h5>" +
                "       </a>" +
                "       <p class='card-text'>" +
                "           You are both into: " + mutualHobbies.join(", ") + "<br>" +
                "           Give " + suggestedUser.username + " a poke to let them know!" +
                "       </p>" +
                "   </div>" +
                "   <div class='card-footer'>" +
                "       <a href='poke/' class='card-link' id='id_poke' data-user-id='" + suggestedUser.username + "'><i class='fa fa-comment'></i>Poke</a>" +
                "   </div>" +
                "</div>" +
                "<br>"
        });
    } else {
        userFeedCards +=
            "<div class='card gedf-card'>" +
            "   <div class='card-header'>There doesn't seem to be any posts :(</div>" +
            "</div>" +
            "<br>"
    }

    userFeedCards += "</div>";
    return userFeedCards;
}

// BUILD FILTER and USER POKES CARD
function buildFilerAndPokesCards(profile, sortType) {
    let filterFeedCard = buildFilterFeedCard(sortType);
    let pokesCard = buildPokesCard(profile);
    return "<div class='col-md-3'>" +
        "   <div class='card gedf-card'>" + filterFeedCard + "</div>" +
        "   <br>" + pokesCard +
        "</div>";
}

// BUILD FILTER FEED CARD - builds with 5 sort types
function buildFilterFeedCard(sortType) {
    let filter = "<div class='card-body'><h5 class='card-title'>Filter feed</h5>";

    $.each(SORT_TYPES, function (i, type) {
        let isCurrentlySelected = "";
        if (sortType === getSortTypeKey(type[0])) {
            isCurrentlySelected = "checked"
        } else {
            isCurrentlySelected = ""
        }

        filter +=
            "<div class='custom-control custom-radio'>" +
            "   <input type='radio' id='" + type[0] + "' name='customRadio' class='custom-control-input'" + isCurrentlySelected + ">" +
            "   <label class='custom-control-label' for='" + type[0] + "'>" + type[1] + "</label>" +
            "</div>"

    });

    filter += "</div>";
    return filter;
}

// BUILD POKE CARDS - builds the poke cards from profile json
function buildPokesCard(profile) {
    let poked = buildPokeString(profile.poked);
    let pokedBy = buildPokeString(profile.pokedBy);

    return "<div class='card gedf-card'>" +
        "   <div class='card-body'><h5 class='card-title'>Poked You</h5>" + pokedBy + "</div>" +
        "</div>" +
        "<br>" +
        "<div class='card gedf-card'>" +
        "   <div class='card-body'><h5 class='card-title'>You Poked</h5>" + poked + "</div>" +
        "</div>"
}

// BUILD POKE STRING - content that goes inside the poke cards
function buildPokeString(allPokes) {
    let poked = "";

    if (allPokes.length > 0) {
        $.each(allPokes, function (i, pokeUser) {
            poked += "@" + pokeUser.username + " -  " + pokeUser.pokes;

            if (pokeUser.pokes > 1) {
                poked += " times <br>"
            } else {
                poked += " time <br>"
            }
        });
    } else {
        poked += "No one :("
    }
    return poked;
}

// BUILD USER NOT LOGGED IN CARD - shown when user is not logged in
function buildNotLoggedInCards() {
    return "<p>You are not logged in</p>" +
        "<button type='button' class='btn btn-primary' data-toggle='modal' data-target='#modal-login' data-type='form'>" +
        "    Login" +
        "</button>" +
        " " +
        "<button type='button' class='btn btn-secondary' data-toggle='modal' data-target='#modal-signup' data-type='form'>" +
        "    Signup" +
        "</button>";
}


// Gets the intersection of hobbies between logged in user and the suggested user
function getMutualHobbies(profile, suggestedUser) {
    return profile.user.hobbies.filter(value => -1 !== suggestedUser.hobbies.indexOf(value));
}

// Given an id, returns the sort type key
function getSortTypeKey(id) {
    return Object.keys(SORT_TYPES).find(key => SORT_TYPES[key][0] === id);
}

// Applies the sort to a list of suggested users from the profile json
function sortedSuggestedUsers(profile, sortType) {
    let suggestedUsers = [];

    switch (sortType) {
        case getSortTypeKey(SORT_TYPES.DEFAULT[0]): {
            suggestedUsers = profile.suggestedUsers;
            break
        }
        case getSortTypeKey(SORT_TYPES.AGE_ASCENDING[0]): {
            suggestedUsers = profile.suggestedUsers.sort((a, b) => parseInt(a.age) - parseInt(b.age));
            break
        }
        case getSortTypeKey(SORT_TYPES.AGE_DESCENDING[0]): {
            suggestedUsers = profile.suggestedUsers.sort((a, b) => parseInt(b.age) - parseInt(a.age));
            break
        }
        case getSortTypeKey(SORT_TYPES.MALE[0]): {
            suggestedUsers = profile.suggestedUsers.sort((a, b) => ('' + b.gender).localeCompare(a.gender));
            break
        }
        case getSortTypeKey(SORT_TYPES.FEMALE[0]): {
            suggestedUsers = profile.suggestedUsers.sort((a, b) => ('' + a.gender).localeCompare(b.gender));
            break
        }
    }
    return suggestedUsers
}