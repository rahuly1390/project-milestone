module.exports = {
  default: {
    parallel: 1,
    format: ['summary', 'progress-bar', 'html:cucumber-report.html'],
    paths: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.js'],
    // REMOVED: requireModule: ['@babel/register'], 
    publishQuiet: true
  }
}