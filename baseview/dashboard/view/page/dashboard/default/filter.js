
var nsref = Lab.Util.Object.ensure("Lab.View.Filters.page.dashboard");
nsref.default = function(viewModel) {

    //"fields.bg": "bg-white"
    var headerBackgroundColor = viewModel.get('fields.bg') || 'bg-white';
    viewModel.setFiltered('bg', headerBackgroundColor);

};
