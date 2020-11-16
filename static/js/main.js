

// OnLoad Run
window.addEventListener('load', function() {
    switch (window.location.pathname.replace('/gov-self-help', '').toLowerCase()) {
        case '/':
        case '/index.html':
            InitSelfHelpMenu();
            break;

        case '/other-help.html':
            InitFormDemoFunc();
            // InitFormListeners();
            break;
    
        default:
            break;
    }
});


function InitSelfHelpMenu() {
    Array.from(document.querySelectorAll('.help-topic .topic-header')).forEach((selected_topic) => {
        selected_topic.addEventListener('click', (event) => {
            var open_topic = document.querySelector('.help-topic-expanded');
            if (open_topic) {
                open_topic.classList.remove('help-topic-expanded');
            }

            if (open_topic !== selected_topic.parentElement) {
                selected_topic.parentElement.classList.add('help-topic-expanded');
            }
        });
    });
}


function InitFormDemoFunc() {
    var type_selector = document.querySelector('#type');
    var type_sections = document.querySelectorAll('[data-type-select]');
    var type_section_birthday = document.querySelector('[data-type-select="birthday"]');
    var type_section_military = document.querySelector('[data-type-select="military"]');
    
    
    type_selector.addEventListener('change', (event) => {
        Array.from(type_sections).forEach((section) => {
            section.setAttribute('hidden', 'true');
        });

        switch (type_selector.value) {
            case 'military':
                type_section_military.removeAttribute('hidden');
                break;

            case 'birthday':
                type_section_birthday.removeAttribute('hidden');
                break;
        
            default:
                break;
        }
        document.querySelector('.form-select-module').setAttribute('hidden', 'true');
        document.querySelector('.form-module').removeAttribute('hidden');
    });

    document.querySelector('.form-back-button').addEventListener('click', () => {
        document.querySelector('.form-module').setAttribute('hidden', 'true');
        document.querySelector('.form-select-module').removeAttribute('hidden');
    });
}


// Forms related functions
function InitFormListeners() {
    if ($('[data-form-submit-target]').length) {
        $('[data-form-submit-target]').each(function() {
            let form_submit_button = $('[data-form-submit-target]');
            let form = $('#' + $(form_submit_button).attr('data-form-submit-target'));
            let form_inputs = $('#' + form.attr('id') + ' input, ' + '#' + form.attr('id') + ' textarea');

            SetupInputListeners(form_inputs);

            $(this).on('click', function(event) {
                EvaluateFormSubmit(form, form_inputs);
            });
        });
    }
    else {
        return;
    }
}

function SetupInputListeners(form_inputs) {
    $(form_inputs).each(function() {
        if ($(this.parentElement).hasClass('form-set-required')) {
            $(this).on('change', function(event) {
                if (this.value !== '') {
                    $(this.parentElement).removeClass('form-set-failed');
                }
            });
        }
    });
}


function EvaluateFormSubmit(form, form_inputs) {
    let form_inputs_evaluated = ValidateFormFields(form_inputs);

    ProcessFormFields(form_inputs_evaluated[0], form_inputs_evaluated[1]);

    if (form_inputs_evaluated[0].length === 0) {
        let form_submit_json_string = BuildFormSubmitJson(form_inputs);
        ProcessFormSubmit(form, form_submit_json_string);
    }
}


function ValidateFormFields(form_inputs) {
    let failed_inputs = [];
    let passed_inputs = [];

    $(form_inputs).each(function() {
        if ($(this.parentElement).hasClass('form-set-required')) {
            if (this.value !== '') {
                passed_inputs.push(this);
            }
            else {
                failed_inputs.push(this);
            }
        }
    });

    return [failed_inputs, passed_inputs];
}


function ProcessFormFields(failed_inputs, passed_inputs) {
    if (failed_inputs.length > 0) {
        failed_inputs[0].focus();
    }

    $(failed_inputs).each(function() {
        $(this.parentElement).addClass('form-set-failed');
    });

    $(passed_inputs).each(function() {
        $(this.parentElement).removeClass('form-set-failed');
    });
}


function BuildFormSubmitJson(form_inputs) {
    let form_value_json = {};

    $(form_inputs).each(function() {
        if (this.type === 'checkbox') {
            form_value_json[this.getAttribute('data-db-field-name')] = this.checked;
        }
        else {
            form_value_json[this.getAttribute('data-db-field-name')] = this.value;
        }
    });

    return JSON.stringify(form_value_json);
}


function ProcessFormSubmit(form, form_submit_json_string) {
    let url = 'https://webapi.mitalent.org/SixtyBy30/SaveJsonLog?JsonLogData=' + encodeURI(form_submit_json_string);

    UpdateFormDisplay(form, 'loading');

    $.ajax({
        type: "POST",
        url: url
    })
        .done(function() {
            UpdateFormDisplay(form, 'success');
        })
        .fail(function() {
            UpdateFormDisplay(form, 'error');
        })
        .always(function() {
            console.log("finished");
        });
}


function UpdateFormDisplay(form, request_status_code) {
    if (request_status_code === 'loading') {
        $('[data-form-loading-target=' + form.attr('id') + ']').addClass('form-loading-show');
    }
    else {
        $('[data-form-loading-target=' + form.attr('id') + ']').removeClass('form-loading-show');

        form.hide();

        if (request_status_code === 'success') {
            $('[data-form-results-target=' + form.attr('id') + ']').addClass('form-results-success');
            $('[data-form-results-target=' + form.attr('id') + '] .results-success').focus();
        }
        else {
            $('[data-form-results-target=' + form.attr('id') + ']').addClass('form-results-fail');
            $('[data-form-results-target=' + form.attr('id') + '] .results-fail').focus();
        }
    }
}