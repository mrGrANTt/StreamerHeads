<?php
    include_once("generate_head.php");

    function gen($name, $url) {
        $result =
            "<script>".
                "var el = rendered.get(\"".$name."\");".
                "if(el == undefined) {".
                    "el = document.createElement(\"div\");".
                    "el.className = \"player_heads\";".
                    "el.innerHTML = \"\n\" ".
                    "+ \"            <p class=\"name\">".$name."</p>\n\" ".
                    "+ \"            <div class=\"head\">\n\"".
                    "+ \"                <img src=\"heads/".$name.".png\" class=\"head0\">\n\"".
                    "+ \"                <img src=\"heads/".$name."1.png\" class=\"head1\">\n\"".
                    "+ \"            </div>\n\"".
                    "+ \"        </div>\";".
                "} else {".
                "}".
                "rendered.set(\"".$name."\", new Head())".
                "el = undefined".
            "</script>";

        gen_head($name, $url);

        return $result;
    }

    $out = gen("NAME","URL");

    echo $out;
?>