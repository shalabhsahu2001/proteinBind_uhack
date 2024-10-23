"use client";
import React, { Component } from "react";
import _ from "lodash";
import PropTypes from "prop-types";
import initRDKitModule from "@rdkit/rdkit";

const initRDKit = (() => {
  let rdkitLoadingPromise;
  return () => {
    if (!rdkitLoadingPromise) {
      rdkitLoadingPromise = initRDKitModule().catch((e) => {
        throw e;
      });
    }
    return rdkitLoadingPromise;
  };
})();

class MoleculeStructure extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    className: PropTypes.string,
    svgMode: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    structure: PropTypes.string.isRequired,
    subStructure: PropTypes.string,
    extraDetails: PropTypes.object,
    drawingDelay: PropTypes.number,
    scores: PropTypes.number,
  };

  static defaultProps = {
    subStructure: "",
    className: "",
    width: 250,
    height: 200,
    svgMode: false,
    extraDetails: {},
    drawingDelay: undefined,
    scores: 0,
  };

  constructor(props) {
    super(props);
    this.state = {
      svg: undefined,
      rdKitLoaded: false,
      rdKitError: false,
    };
  }

  componentDidMount() {
    initRDKit()
      .then((RDKit) => {
        this.RDKit = RDKit;
        this.setState({ rdKitLoaded: true }, this.draw);
      })
      .catch((err) => {
        console.error(err);
        this.setState({ rdKitError: true });
      });
  }

  componentDidUpdate(prevProps) {
    const { rdKitLoaded, rdKitError } = this.state;
    const { structure, svgMode, subStructure, width, height, extraDetails } = this.props;

    if (!rdKitError && rdKitLoaded) {
      const shouldUpdateDrawing =
        prevProps.structure !== structure ||
        prevProps.svgMode !== svgMode ||
        prevProps.subStructure !== subStructure ||
        prevProps.width !== width ||
        prevProps.height !== height ||
        !_.isEqual(prevProps.extraDetails, extraDetails);

      if (shouldUpdateDrawing) {
        this.draw();
      }
    }
  }

  draw() {
    const { structure, svgMode, subStructure } = this.props;
    if (!this.state.rdKitLoaded) return;

    const mol = this.RDKit.get_mol(structure || "invalid");
    const qmol = this.RDKit.get_qmol(subStructure || "invalid");
    const isValidMol = this.isValidMol(mol);

    if (svgMode && isValidMol) {
      const svg = mol.get_svg_with_highlights(this.getMolDetails(mol, qmol));
      this.setState({ svg });
    } else if (isValidMol) {
      const canvas = document.getElementById(this.props.id);
      mol.draw_to_canvas_with_highlights(canvas, this.getMolDetails(mol, qmol));
    }

    mol?.delete();
    qmol?.delete();
  }

  isValidMol(mol) {
    return !!mol;
  }

  getMolDetails(mol, qmol) {
    if (this.isValidMol(mol) && this.isValidMol(qmol)) {
      const subStructHighlightDetails = JSON.parse(
        mol.get_substruct_matches(qmol)
      );
      const subStructHighlightDetailsMerged = !_.isEmpty(subStructHighlightDetails)
        ? subStructHighlightDetails.reduce(
            (acc, { atoms, bonds }) => ({
              atoms: [...acc.atoms, ...atoms],
              bonds: [...acc.bonds, ...bonds],
            }),
            { bonds: [], atoms: [] }
          )
        : subStructHighlightDetails;
      return JSON.stringify({
        width: this.props.width,
        height: this.props.height,
        bondLineWidth: 1,
        addStereoAnnotation: true,
        ...(this.props.extraDetails || {}),
        ...subStructHighlightDetailsMerged,
      });
    } else {
      return JSON.stringify({
        width: this.props.width,
        height: this.props.height,
        bondLineWidth: 1,
        addStereoAnnotation: true,
        ...(this.props.extraDetails || {}),
      });
    }
  }

  render() {
    const { rdKitError, rdKitLoaded, svg } = this.state;
    const { structure, svgMode, className, width, height, id, scores } = this.props;

    if (rdKitError) return "Error loading renderer.";
    if (!rdKitLoaded) return "Loading renderer...";

    const mol = this.RDKit.get_mol(structure || "invalid");
    const isValidMol = this.isValidMol(mol);
    mol?.delete();

    if (!isValidMol) {
      return <span title={`Cannot render structure: ${structure}`}>Render Error.</span>;
    }

    if (svgMode) {
      return (
        <div
          title={structure}
          className={`molecule-structure-svg ${className}`}
          style={{ width, height }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      );
    } else {
      return (
        <div className={`molecule-canvas-container ${className}`}>
          <canvas
            title={structure}
            id={id}
            width={width}
            height={height}
          />
          {scores > 0 && (
            <p className="text-red-600 z-50 p-10">Score: {scores.toFixed(2)}</p>
          )}
        </div>
      );
    }
  }
}

export default MoleculeStructure;
