$(function () {
    $(".pay_item").click(function () {
        $(this).addClass('checked').siblings('.pay_item').removeClass('checked');
        var dataid = $(this).attr('data-id');
        if (dataid == "app4") {
            $(".shang_payimg a").attr("href", "https://patreon.com/CHonesetDoPa");
            $(".shang_payimg img").attr("title", "点击前往Patreon");
        } else {
            $(".shang_payimg a").attr("href", "#");
            $(".shang_payimg img").attr("title", "扫一扫");
        }
        $(".shang_payimg img").attr("src", "assets/images/sponsor/" + dataid + ".png");
    });
});
function dashangToggle() {
    $(".hide_box").fadeToggle();
    $(".shang_box").fadeToggle();
}