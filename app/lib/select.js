(function ( $ ) {
 
    $.fn.pwSelect = function() {
        var self = $(this);

        var api = {
            self : false,
            active : false,
            setup : function(){
                //self.hide();
                this.self = self;
                this.active = $('<span class="pw-select-active"></span>');
                var selected = self.find(':selected');
                if(selected){
                    this.active.text(selected.text());
                }
                this.self.after(this.active);
                this.self.addClass('pwSelect');
            },
            setActive : function(value, text){
                this.active.text(text);
            },
            originalChange : function(){
                $(this).data('pwSelect').setActive($(this).val(), $(this).find(':selected').text());
            },
            options : [],
        };

        api.setup();
        self.on('change', api.originalChange);

        self.data('pwSelect', api);
    };
 
}( jQuery ));