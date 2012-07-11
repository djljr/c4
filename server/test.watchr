def run_all_tests
    puts `clear`
    puts `./node_modules/expresso/bin/expresso`
end
watch('.*.js') { run_all_tests }
run_all_tests
