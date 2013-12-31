# !/bin/bash
# Pre-commit hook passing files through jshint
#
# This ensures that all js, html and json files are valid and conform
# to expectations.

ROOT_DIR=$(git rev-parse --show-toplevel)
JSHINT="${ROOT_DIR}/node_modules/jshint/bin/jshint -c ${ROOT_DIR}/.jshintrc"

CODE=0
for file in $(git diff-index --name-only --cached HEAD -- | grep -w "src/" | grep '\.js$'); do
    echo "jshint ${file} ..."
    ${JSHINT} ${file}
    if [ ${?} -ne 0 ] ; then
        CODE=1
    fi
done

exit ${CODE}
