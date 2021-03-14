let editable = false;
let previousBio = $("#textarea-bio").val();
if(previousBio === ""){
    $("#textarea-bio").attr("placeholder", "Please fill in a bio");
}
$("#btn-edit-save").click(function(){
    $("#textarea-bio").attr("disabled", editable);
    if(editable) {
        $(this).text("Edit");
        if(previousBio !== $("#textarea-bio").val()){
            updateBio($("#textarea-bio").val());
        }
    } else {
        $(this).text("Save");
    }
    editable = !editable;
});
function updateBio(bio){
    previousBio = bio;
    $.ajax({
        url: "profile/update/"+bio,
        type: "POST",
        contentType: "application/json",
        success: function(data){}
    });
}