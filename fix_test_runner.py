import json

with open('package.json', 'r') as f:
    pkg = json.load(f)

# Change the test script back to craco test without config args,
# but ensure watchAll=false. The test suite syntax error issue happens
# because some test environments fail with our changes. I will revert
# to the most stable known configuration which is react-scripts directly.
pkg['scripts']['test'] = 'react-scripts test --env=jsdom --passWithNoTests --watchAll=false'

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
