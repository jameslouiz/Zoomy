module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*!' + "\n" +
                    ' * <%= pkg.name %> - v<%= pkg.version %>' + "\n" +
                    ' *' + "\n" +
                    ' * <%= pkg.description %>' + "\n" +
                    ' *' + "\n" +
                    ' * By <%= pkg.author.name %>' + "\n" +
                    ' *    <%= pkg.author.email %>' + "\n" +
                    ' *    <%= pkg.author.url %>' + "\n" +
                    ' *' + "\n" +
                    ' */'
            },
            build: {
                src: ['<banner>','src/jquery.zoomy.js'],
                dest: 'jquery.zoomy.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', 'uglify');

}

